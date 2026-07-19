// Command server is backend-v2's entry point: load config, build the
// pgxpool, wire the Gin engine, and serve with graceful shutdown.
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	secure "github.com/gin-contrib/secure"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ulule/limiter/v3"
	limitermemory "github.com/ulule/limiter/v3/drivers/store/memory"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/auth"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/auth/supabaseauth"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/config"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db/queries"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/handlers"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/jobs"
	appmiddleware "github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/middleware"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/notify"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/r2"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/services"
)

const shutdownGrace = 10 * time.Second

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer pool.Close()

	verifier, err := newVerifier(ctx, cfg)
	if err != nil {
		log.Fatalf("auth: %v", err)
	}

	r2Client, err := r2.New(ctx, cfg.R2AccountID, cfg.R2AccessKeyID, cfg.R2SecretKey, cfg.R2BucketName, cfg.R2PublicURLBase)
	if err != nil {
		log.Fatalf("r2: %v", err)
	}

	if cfg.NodeEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Logger(), gin.CustomRecovery(appmiddleware.Recovery))

	// Trusts one reverse-proxy hop by default, matching app.ts's
	// `app.set('trust proxy', ...)` — adjust TRUST_PROXY_HOPS if that
	// topology changes. Gin has no direct "N hops" concept, so this is
	// approximated as "trust no proxies" (hops <= 0) or "trust all"
	// otherwise; revisit once the real deployment topology is known.
	if cfg.TrustProxyHops <= 0 {
		router.SetTrustedProxies(nil)
	}

	router.Use(secure.New(secure.Config{
		SSLRedirect:           false,
		STSSeconds:            31536000,
		STSIncludeSubdomains:  true,
		FrameDeny:             true,
		ContentTypeNosniff:    true,
		BrowserXssFilter:      true,
		ContentSecurityPolicy: "default-src 'self'",
		ReferrerPolicy:        "no-referrer",
	}))

	router.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "timestamp": time.Now().UTC().Format(time.RFC3339)})
	})

	notificationSvc := registerRoutes(router, pool, verifier, cfg, r2Client)

	router.NoRoute(appmiddleware.NotFound)

	scheduler, err := jobs.StartReminderScheduler(notificationSvc)
	if err != nil {
		log.Fatalf("scheduler: %v", err)
	}

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: router,
	}

	go func() {
		log.Printf("Server running on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	<-ctx.Done()
	stop()
	log.Println("shutdown signal received. Shutting down gracefully...")

	schedulerStopCtx := scheduler.Stop()
	<-schedulerStopCtx.Done()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownGrace)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("forced shutdown after timeout: %v", err)
		os.Exit(1)
	}
	log.Println("Server closed.")
}

// newVerifier builds the local JWT verifier per config.JWTVerificationMode
// -- see plan §4's note that this must be confirmed against the actual
// Supabase project (JWKS/ES256 vs legacy HS256), not assumed.
func newVerifier(ctx context.Context, cfg *config.Config) (*auth.Verifier, error) {
	if cfg.JWTVerificationMode == "hs256" {
		return auth.NewHS256Verifier(cfg.SupabaseJWTSecret), nil
	}
	return auth.NewJWKSVerifier(ctx, cfg.SupabaseURL)
}

// registerRoutes mounts every phase-2 through phase-6 endpoint -- see
// plans/backend-go-migration.md §2-6. Returns the NotificationService so
// main can wire it into the cron scheduler.
func registerRoutes(router *gin.Engine, pool *pgxpool.Pool, verifier *auth.Verifier, cfg *config.Config, r2Client *r2.Client) *services.NotificationService {
	q := queries.New(pool)

	dashboardSvc := services.NewDashboardService(q)
	profileSvc := services.NewProfileService(q)
	calendarSvc := services.NewCalendarService(q)
	dailySvc := services.NewDailyService(q)
	weeklySvc := services.NewWeeklyService(q, r2Client)
	thriveSvc := services.NewThriveService(q)
	stressSvc := services.NewStressService(q)
	mindfulSvc := services.NewMindfulService(q)
	journeySvc := services.NewJourneyService(q, dailySvc, weeklySvc, thriveSvc, stressSvc, mindfulSvc)
	authSvc := services.NewAuthService(q)
	expoClient := notify.NewClient()
	notificationSvc := services.NewNotificationService(q, expoClient, dailySvc, weeklySvc, thriveSvc, stressSvc, mindfulSvc)

	dashboardHandler := handlers.NewDashboardHandler(dashboardSvc)
	journeyHandler := handlers.NewJourneyHandler(journeySvc)
	profileHandler := handlers.NewProfileHandler(profileSvc)
	calendarHandler := handlers.NewCalendarHandler(calendarSvc)
	dailyHandler := handlers.NewDailyHandler(dailySvc)
	thriveHandler := handlers.NewThriveHandler(thriveSvc)
	stressHandler := handlers.NewStressHandler(stressSvc)
	mindfulHandler := handlers.NewMindfulHandler(mindfulSvc)
	weeklyHandler := handlers.NewWeeklyHandler(weeklySvc)
	notificationHandler := handlers.NewNotificationHandler(notificationSvc)

	supabaseAuthClient := supabaseauth.NewClient(cfg.SupabaseURL, cfg.SupabaseAnonKey, cfg.SupabaseServiceRoleKey)
	authHandler := handlers.NewAuthHandler(supabaseAuthClient, authSvc)

	requireAuth := appmiddleware.RequireAuth(verifier)

	// Rate limiters: authLimiter (15min/20) on /api/auth/*, apiLimiter
	// (15min/300) on everything else -- matches app.ts's authLimiter/
	// apiLimiter exactly (see plan §4). Separate stores so a client's
	// auth-route hits and api-route hits count into independent buckets
	// keyed by the same IP, not one shared counter. In-memory: fine for a
	// single instance; horizontal scaling would need a shared store
	// (e.g. Redis, which ulule/limiter also supports) to rate-limit
	// across instances instead of per-instance.
	authLimiter := appmiddleware.RateLimit(
		limiter.New(limitermemory.NewStore(), limiter.Rate{Period: 15 * time.Minute, Limit: 20}),
		"Too many attempts. Please try again after 15 minutes.",
	)
	apiLimiter := appmiddleware.RateLimit(
		limiter.New(limitermemory.NewStore(), limiter.Rate{Period: 15 * time.Minute, Limit: 300}),
		"Too many requests. Please slow down.",
	)

	// Routes are registered as exact full paths rather than via
	// sub-groups with a "/" relative pattern -- a Gin group.GET("/", ...)
	// registers "<base>/" (with trailing slash) as a distinct route from
	// "<base>", and Gin's default trailing-slash redirect doesn't match
	// Express's exact-match behavior. Mobile/web-app call e.g.
	// "/api/journey" and "/api/profile" with no trailing slash, so the
	// literal path is registered directly to stay a true drop-in
	// replacement (see plan's "must be a drop-in replacement" decision).
	api := router.Group("/api")

	api.GET("/dashboard/summary", apiLimiter, requireAuth, dashboardHandler.GetSummary)

	api.GET("/journey/status", apiLimiter, requireAuth, journeyHandler.GetStatus)
	api.GET("/journey", apiLimiter, requireAuth, journeyHandler.GetData)

	api.GET("/profile", apiLimiter, requireAuth, profileHandler.GetProfile)
	api.GET("/profile/about-me", apiLimiter, requireAuth, profileHandler.GetAboutMe)

	api.GET("/calendar/events", apiLimiter, requireAuth, calendarHandler.GetEvents)
	// Canonical duplicate path for web clients -- see roadmapRoutes.ts.
	api.GET("/roadmap/calendar/events", apiLimiter, requireAuth, calendarHandler.GetEvents)

	// Daily Sliders
	api.GET("/roadmap/daily/status", apiLimiter, requireAuth, dailyHandler.GetStatus)
	api.POST("/roadmap/daily/video-progress", apiLimiter, requireAuth, dailyHandler.UpdateVideoProgress)
	api.POST("/roadmap/daily", apiLimiter, requireAuth, dailyHandler.SubmitEntry)

	// Thrive Tracker (WEMWBS-14)
	api.GET("/roadmap/thrive/status", apiLimiter, requireAuth, thriveHandler.GetStatus)
	api.POST("/roadmap/thrive", apiLimiter, requireAuth, thriveHandler.SubmitEntry)

	// Stress Snapshot (PSS-10)
	api.GET("/roadmap/stress/status", apiLimiter, requireAuth, stressHandler.GetStatus)
	api.POST("/roadmap/stress", apiLimiter, requireAuth, stressHandler.SubmitEntry)

	// Mindful Mirror (FFMQ-15)
	api.GET("/roadmap/mindful/status", apiLimiter, requireAuth, mindfulHandler.GetStatus)
	api.POST("/roadmap/mindful", apiLimiter, requireAuth, mindfulHandler.SubmitEntry)

	// Weekly Whispers
	api.GET("/roadmap/weekly/status", apiLimiter, requireAuth, weeklyHandler.GetStatus)
	api.GET("/roadmap/weekly/video", apiLimiter, requireAuth, weeklyHandler.GetVideo)
	api.POST("/roadmap/weekly/upload", apiLimiter, requireAuth, weeklyHandler.UploadAudio)
	api.POST("/roadmap/weekly", apiLimiter, requireAuth, weeklyHandler.SubmitEntry)

	// Auth flows are unauthenticated by definition (they're how a client
	// gets a token in the first place) -- no requireAuth here.
	api.POST("/auth/signup", authLimiter, authHandler.Signup)
	api.POST("/auth/login", authLimiter, authHandler.Login)
	api.POST("/auth/verify-otp", authLimiter, authHandler.VerifyOtp)
	api.POST("/auth/resend-otp", authLimiter, authHandler.ResendOtp)
	api.POST("/auth/reset-password", authLimiter, authHandler.ResetPassword)
	api.POST("/auth/confirm-reset", authLimiter, authHandler.ConfirmPasswordReset)
	api.POST("/auth/refresh", authLimiter, authHandler.RefreshToken)

	api.POST("/notifications/register-token", apiLimiter, requireAuth, notificationHandler.RegisterToken)
	api.POST("/notifications/unregister-token", apiLimiter, requireAuth, notificationHandler.UnregisterToken)

	return notificationSvc
}
