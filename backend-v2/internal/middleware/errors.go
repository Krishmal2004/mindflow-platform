// Package middleware holds cross-cutting Gin middleware (auth, rate
// limiting, error handling).
package middleware

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// NotFound matches app.ts's 404 handler response shape exactly, since
// mobile/web-app error handling keys off { error: string }.
func NotFound(c *gin.Context) {
	c.JSON(http.StatusNotFound, gin.H{"error": "Route not found"})
}

// Recovery matches app.ts's global error handler: log the real error
// server-side, never leak stack traces to the client.
func Recovery(c *gin.Context, recovered any) {
	log.Printf("[Unhandled Error] %v", recovered)
	c.JSON(http.StatusInternalServerError, gin.H{"error": "An unexpected error occurred. Please try again later."})
	c.Abort()
}
