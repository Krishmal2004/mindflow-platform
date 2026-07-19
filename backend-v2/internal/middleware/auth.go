package middleware

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/auth"
)

// RequireAuth is a port of backend/src/middlewares/authMiddleware.ts's
// requireAuth: verifies the Bearer token locally instead of round-
// tripping to Supabase's Auth API, but preserves the exact error
// shapes/status codes the mobile/web-app error-handling code depends on.
func RequireAuth(verifier *auth.Verifier) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing or malformed authorization header"})
			return
		}

		token := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
		claims, err := verifier.Verify(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		setAuthUser(c, AuthUser{ID: claims.Subject, Email: claims.Email})
		c.Next()
	}
}

// RequireAdmin is a port of requireAdmin: queries the admins table for the
// already-authenticated user. Defined but deliberately left unwired from
// any route, matching today's Express app -- see plan §4.
func RequireAdmin(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, ok := AuthUserFromContext(c)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authentication required before admin check"})
			return
		}

		var id string
		err := pool.QueryRow(c.Request.Context(), "SELECT id FROM admins WHERE id = $1", user.ID).Scan(&id)
		if err != nil {
			log.Printf("Unauthorized Admin Access Attempt by: %s", user.ID)
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Forbidden: Admin Access Only"})
			return
		}

		c.Next()
	}
}
