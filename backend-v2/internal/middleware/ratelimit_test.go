package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ulule/limiter/v3"
	limitermemory "github.com/ulule/limiter/v3/drivers/store/memory"
)

func newLimitedRouter(limit int64) *gin.Engine {
	l := limiter.New(limitermemory.NewStore(), limiter.Rate{Period: 15 * time.Minute, Limit: limit})
	r := gin.New()
	r.GET("/limited", RateLimit(l, "Too many requests. Please slow down."), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	return r
}

func TestRateLimit_AllowsUnderLimit(t *testing.T) {
	r := newLimitedRouter(3)

	for i := 0; i < 3; i++ {
		req := httptest.NewRequest(http.MethodGet, "/limited", nil)
		req.RemoteAddr = "203.0.113.1:12345"
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("request %d: status = %d, want 200", i, w.Code)
		}
		if w.Header().Get("RateLimit-Limit") != "3" {
			t.Errorf("request %d: RateLimit-Limit = %q, want 3", i, w.Header().Get("RateLimit-Limit"))
		}
		if w.Header().Get("X-RateLimit-Limit") != "" {
			t.Errorf("request %d: legacy X-RateLimit-Limit header present, want none (standardHeaders only)", i)
		}
	}
}

func TestRateLimit_BlocksOverLimit(t *testing.T) {
	r := newLimitedRouter(2)

	for i := 0; i < 2; i++ {
		req := httptest.NewRequest(http.MethodGet, "/limited", nil)
		req.RemoteAddr = "203.0.113.2:12345"
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("request %d: status = %d, want 200", i, w.Code)
		}
	}

	req := httptest.NewRequest(http.MethodGet, "/limited", nil)
	req.RemoteAddr = "203.0.113.2:12345"
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want 429, body=%s", w.Code, w.Body.String())
	}
	if w.Body.String() != `{"error":"Too many requests. Please slow down."}` {
		t.Errorf("body = %s", w.Body.String())
	}
}

func TestRateLimit_ScopedPerIP(t *testing.T) {
	r := newLimitedRouter(1)

	req1 := httptest.NewRequest(http.MethodGet, "/limited", nil)
	req1.RemoteAddr = "203.0.113.3:1"
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	if w1.Code != http.StatusOK {
		t.Fatalf("first IP's first request: status = %d, want 200", w1.Code)
	}

	// Same IP, second request: over limit.
	req2 := httptest.NewRequest(http.MethodGet, "/limited", nil)
	req2.RemoteAddr = "203.0.113.3:2"
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusTooManyRequests {
		t.Fatalf("first IP's second request: status = %d, want 429", w2.Code)
	}

	// Different IP: independent bucket, must not be blocked by the first
	// IP's usage.
	req3 := httptest.NewRequest(http.MethodGet, "/limited", nil)
	req3.RemoteAddr = "203.0.113.4:1"
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)
	if w3.Code != http.StatusOK {
		t.Fatalf("second IP's first request: status = %d, want 200 (independent bucket)", w3.Code)
	}
}

func TestRateLimit_IndependentLimitersDoNotShareBuckets(t *testing.T) {
	// Two independently-constructed limiters (as authLimiter/apiLimiter
	// are in main.go, each with their own store) keyed by the same IP
	// must not contaminate each other's counts.
	authLimiter := limiter.New(limitermemory.NewStore(), limiter.Rate{Period: 15 * time.Minute, Limit: 1})
	apiLimiter := limiter.New(limitermemory.NewStore(), limiter.Rate{Period: 15 * time.Minute, Limit: 1})

	r := gin.New()
	r.GET("/auth", RateLimit(authLimiter, "auth limited"), func(c *gin.Context) { c.Status(http.StatusOK) })
	r.GET("/api", RateLimit(apiLimiter, "api limited"), func(c *gin.Context) { c.Status(http.StatusOK) })

	ip := "203.0.113.5:1"

	req := httptest.NewRequest(http.MethodGet, "/auth", nil)
	req.RemoteAddr = ip
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("auth route (1st hit): status = %d, want 200", w.Code)
	}

	// Same IP hitting the OTHER route must still have its own full quota.
	req2 := httptest.NewRequest(http.MethodGet, "/api", nil)
	req2.RemoteAddr = ip
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusOK {
		t.Fatalf("api route (1st hit, same IP as auth route): status = %d, want 200 (independent limiter)", w2.Code)
	}
}
