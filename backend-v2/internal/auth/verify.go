// Package auth verifies already-issued Supabase JWTs locally (no
// per-request network round trip) per plans/backend-go-migration.md §4.
// Signup/login/OTP/refresh/reset remain thin proxies to Supabase's Auth
// HTTP API elsewhere in this package -- this file only replaces how
// tokens are checked once issued.
package auth

import (
	"context"
	"fmt"
	"strings"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/golang-jwt/jwt/v5"
)

const requiredAudience = "authenticated"

// Claims mirrors the fields backend/src/middlewares/authMiddleware.ts reads
// off Supabase's access token: user id (sub) and email.
type Claims struct {
	jwt.RegisteredClaims
	Email string `json:"email"`
}

func (c *Claims) hasAudience(want string) bool {
	for _, a := range c.Audience {
		if a == want {
			return true
		}
	}
	return false
}

// Verifier checks a token's signature, expiry, and audience.
type Verifier struct {
	keyfunc      jwt.Keyfunc
	validMethods []string
}

// NewJWKSVerifier builds a Verifier backed by Supabase's background-
// refreshing JWKS endpoint. Only asymmetric methods are accepted --
// deliberately excludes HS256 here so a token signed with a guessable/
// leaked HMAC secret can't be forged and accepted as if it were
// JWKS-verified (the classic JWT "algorithm confusion" issue).
func NewJWKSVerifier(ctx context.Context, supabaseURL string) (*Verifier, error) {
	jwksURL := strings.TrimSuffix(supabaseURL, "/") + "/auth/v1/.well-known/jwks.json"
	kf, err := keyfunc.NewDefaultCtx(ctx, []string{jwksURL})
	if err != nil {
		return nil, fmt.Errorf("building JWKS client for %s: %w", jwksURL, err)
	}
	return &Verifier{
		keyfunc:      kf.Keyfunc,
		validMethods: []string{"RS256", "ES256"},
	}, nil
}

// NewHS256Verifier builds a Verifier against a static shared secret, for
// Supabase projects still on legacy HS256 signing
// (JWT_VERIFICATION_MODE=hs256). Only HS256 is accepted, for the same
// algorithm-confusion reason as above.
func NewHS256Verifier(secret string) *Verifier {
	key := []byte(secret)
	return &Verifier{
		keyfunc: func(token *jwt.Token) (interface{}, error) {
			return key, nil
		},
		validMethods: []string{"HS256"},
	}
}

// Verify parses and validates tokenString: signature, exp, and
// aud=="authenticated" -- the same checks Supabase's own
// supabase.auth.getUser performs server-side today.
func (v *Verifier) Verify(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, v.keyfunc, jwt.WithValidMethods(v.validMethods))
	if err != nil {
		return nil, err
	}
	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	if !claims.hasAudience(requiredAudience) {
		return nil, fmt.Errorf("unexpected audience")
	}
	return claims, nil
}
