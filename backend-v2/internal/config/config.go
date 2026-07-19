// Package config loads backend-v2's environment configuration. Env var names
// mirror backend/src/config exactly (SUPABASE_*, R2_*, PORT, CORS_ORIGINS,
// TRUST_PROXY_HOPS) — see CLAUDE.md's note on backend env var naming.
package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Port                   string
	NodeEnv                string
	TrustProxyHops         int
	CORSOrigins            []string
	DatabaseURL            string
	SupabaseURL            string
	SupabaseAnonKey        string
	SupabaseServiceRoleKey string
	// JWTVerificationMode is "jwks" (default, asymmetric RS256/ES256 via
	// Supabase's JWKS endpoint) or "hs256" (legacy shared-secret signing).
	// Which one a given Supabase project uses must be confirmed in the
	// dashboard (Settings -> API -> JWT Keys) -- see plan §4.
	JWTVerificationMode string
	SupabaseJWTSecret   string

	R2AccountID     string
	R2AccessKeyID   string
	R2SecretKey     string
	R2BucketName    string
	R2PublicURLBase string
}

var defaultCORSOrigins = []string{
	"http://localhost:5173",
	"http://localhost:5174",
	"http://localhost:8081",
}

// Load reads configuration from the environment and fails fast if a
// required value is missing, mirroring backend/src/config/supabase.ts's
// startup check.
func Load() (*Config, error) {
	cfg := &Config{
		Port:                   getEnv("PORT", "3000"),
		NodeEnv:                getEnv("NODE_ENV", "development"),
		DatabaseURL:            os.Getenv("DATABASE_URL"),
		SupabaseURL:            os.Getenv("SUPABASE_URL"),
		SupabaseAnonKey:        os.Getenv("SUPABASE_ANON_KEY"),
		SupabaseServiceRoleKey: os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
		JWTVerificationMode:    getEnv("JWT_VERIFICATION_MODE", "jwks"),
		SupabaseJWTSecret:      os.Getenv("SUPABASE_JWT_SECRET"),
		R2AccountID:            os.Getenv("R2_ACCOUNT_ID"),
		R2AccessKeyID:          os.Getenv("R2_ACCESS_KEY_ID"),
		R2SecretKey:            os.Getenv("R2_SECRET_ACCESS_KEY"),
		R2BucketName:           os.Getenv("R2_BUCKET_NAME"),
		R2PublicURLBase:        os.Getenv("R2_PUBLIC_URL"),
	}

	if cfg.JWTVerificationMode != "jwks" && cfg.JWTVerificationMode != "hs256" {
		return nil, fmt.Errorf("JWT_VERIFICATION_MODE must be \"jwks\" or \"hs256\", got %q", cfg.JWTVerificationMode)
	}
	if cfg.JWTVerificationMode == "hs256" && cfg.SupabaseJWTSecret == "" {
		return nil, fmt.Errorf("SUPABASE_JWT_SECRET is required when JWT_VERIFICATION_MODE=hs256")
	}

	cfg.TrustProxyHops = 1
	if v := os.Getenv("TRUST_PROXY_HOPS"); v != "" {
		hops, err := strconv.Atoi(v)
		if err != nil {
			return nil, fmt.Errorf("TRUST_PROXY_HOPS must be an integer, got %q: %w", v, err)
		}
		cfg.TrustProxyHops = hops
	}

	if v := os.Getenv("CORS_ORIGINS"); v != "" {
		cfg.CORSOrigins = strings.Split(v, ",")
	} else {
		cfg.CORSOrigins = defaultCORSOrigins
	}

	if cfg.SupabaseURL == "" {
		return nil, fmt.Errorf("FATAL: SUPABASE_URL is not configured")
	}
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("FATAL: DATABASE_URL is not configured")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
