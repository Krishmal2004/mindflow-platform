package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/auth"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func newTestRouter(mw gin.HandlerFunc) *gin.Engine {
	r := gin.New()
	r.GET("/protected", mw, func(c *gin.Context) {
		user, _ := AuthUserFromContext(c)
		c.JSON(http.StatusOK, gin.H{"id": user.ID, "email": user.Email})
	})
	return r
}

func TestRequireAuth_MissingHeader(t *testing.T) {
	v := auth.NewHS256Verifier("secret")
	r := newTestRouter(RequireAuth(v))

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
	if got := w.Body.String(); got != `{"error":"Missing or malformed authorization header"}` {
		t.Errorf("body = %s", got)
	}
}

func TestRequireAuth_MalformedHeader(t *testing.T) {
	v := auth.NewHS256Verifier("secret")
	r := newTestRouter(RequireAuth(v))

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Token abc123")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

func TestRequireAuth_InvalidToken(t *testing.T) {
	v := auth.NewHS256Verifier("secret")
	r := newTestRouter(RequireAuth(v))

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer not-a-real-token")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
	if got := w.Body.String(); got != `{"error":"Invalid token"}` {
		t.Errorf("body = %s", got)
	}
}

func TestRequireAuth_ValidToken(t *testing.T) {
	v := auth.NewHS256Verifier("secret")
	r := newTestRouter(RequireAuth(v))

	claims := &auth.Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "user-42",
			Audience:  jwt.ClaimStrings{"authenticated"},
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
		Email: "p@example.com",
	}
	tokenString, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte("secret"))
	if err != nil {
		t.Fatalf("signing token: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+tokenString)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d, body=%s", w.Code, http.StatusOK, w.Body.String())
	}
	if got := w.Body.String(); got != `{"email":"p@example.com","id":"user-42"}` {
		t.Errorf("body = %s", got)
	}
}

// TestRequireAdmin runs against a real, disposable Postgres container
// (not a mock) since this middleware's whole job is a real SQL lookup
// against the admins table -- see plan §7 on why sqlc/RPC-adjacent code
// is tested against real Postgres via testcontainers-go rather than
// mocked.
func TestRequireAdmin(t *testing.T) {
	ctx := context.Background()

	pgContainer, err := tcpostgres.Run(ctx, "postgres:17",
		tcpostgres.WithDatabase("testdb"),
		tcpostgres.WithUsername("postgres"),
		tcpostgres.WithPassword("postgres"),
		tcpostgres.BasicWaitStrategies(),
	)
	if err != nil {
		t.Fatalf("starting postgres container: %v", err)
	}
	t.Cleanup(func() {
		if err := pgContainer.Terminate(ctx); err != nil {
			t.Logf("terminating container: %v", err)
		}
	})

	connStr, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		t.Fatalf("connection string: %v", err)
	}

	pool, err := pgxpool.New(ctx, connStr)
	if err != nil {
		t.Fatalf("connecting pool: %v", err)
	}
	defer pool.Close()

	_, err = pool.Exec(ctx, `CREATE TABLE admins (id uuid PRIMARY KEY)`)
	if err != nil {
		t.Fatalf("creating admins table: %v", err)
	}
	const adminID = "11111111-1111-1111-1111-111111111111"
	if _, err := pool.Exec(ctx, `INSERT INTO admins (id) VALUES ($1)`, adminID); err != nil {
		t.Fatalf("seeding admin: %v", err)
	}

	newRouterWithUser := func(user AuthUser, hasUser bool) *gin.Engine {
		r := gin.New()
		r.GET("/admin", func(c *gin.Context) {
			if hasUser {
				setAuthUser(c, user)
			}
			c.Next()
		}, RequireAdmin(pool), func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"ok": true})
		})
		return r
	}

	t.Run("no authenticated user", func(t *testing.T) {
		r := newRouterWithUser(AuthUser{}, false)
		req := httptest.NewRequest(http.MethodGet, "/admin", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusUnauthorized)
		}
	})

	t.Run("non-admin user", func(t *testing.T) {
		r := newRouterWithUser(AuthUser{ID: "22222222-2222-2222-2222-222222222222"}, true)
		req := httptest.NewRequest(http.MethodGet, "/admin", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusForbidden {
			t.Fatalf("status = %d, want %d", w.Code, http.StatusForbidden)
		}
		if got := w.Body.String(); got != `{"error":"Forbidden: Admin Access Only"}` {
			t.Errorf("body = %s", got)
		}
	})

	t.Run("admin user", func(t *testing.T) {
		r := newRouterWithUser(AuthUser{ID: adminID}, true)
		req := httptest.NewRequest(http.MethodGet, "/admin", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d, body=%s", w.Code, http.StatusOK, w.Body.String())
		}
	})
}
