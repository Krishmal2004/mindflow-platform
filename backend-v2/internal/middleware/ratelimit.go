package middleware

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ulule/limiter/v3"
)

// RateLimit builds Gin middleware around an ulule/limiter instance, keyed
// by client IP (matching express-rate-limit's default keying -- Gin's
// c.ClientIP() respects the same trusted-proxy configuration as app.ts's
// `trust proxy` setting). Emits the "RateLimit-*" standard headers
// (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset as
// seconds-until-reset), not the deprecated "X-RateLimit-*" ones -- matches
// app.ts's standardHeaders:true, legacyHeaders:false. See plan §4.
func RateLimit(l *limiter.Limiter, message string) gin.HandlerFunc {
	return func(c *gin.Context) {
		result, err := l.Get(c.Request.Context(), c.ClientIP())
		if err != nil {
			// Fail open: a limiter-store error must not block real traffic.
			c.Next()
			return
		}

		c.Header("RateLimit-Limit", strconv.FormatInt(result.Limit, 10))
		c.Header("RateLimit-Remaining", strconv.FormatInt(result.Remaining, 10))
		resetSeconds := result.Reset - time.Now().Unix()
		if resetSeconds < 0 {
			resetSeconds = 0
		}
		c.Header("RateLimit-Reset", strconv.FormatInt(resetSeconds, 10))

		if result.Reached {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": message})
			return
		}
		c.Next()
	}
}
