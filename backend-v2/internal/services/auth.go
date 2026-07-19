package services

import (
	"context"
	"log"
	"strings"
	"unicode"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db/queries"
)

const profileWarning = "Account created, but profile setup is incomplete. Please contact support."

// Port of the free functions and profile-upsert logic in
// backend/src/controllers/authController.ts.
type AuthService struct {
	q queries.Querier
}

func NewAuthService(q queries.Querier) *AuthService {
	return &AuthService{q: q}
}

// DeriveDisplayName derives a display name from email when fullName is
// absent, guaranteeing the DB's username_length CHECK (>= 3 chars).
func DeriveDisplayName(email, fullName string) string {
	if fullName != "" {
		return fullName
	}
	local := email
	if i := strings.IndexByte(email, '@'); i >= 0 {
		local = email[:i]
	}
	base := ""
	if local != "" {
		r := []rune(local)
		base = string(unicode.ToUpper(r[0])) + string(r[1:])
	}
	for len(base) < 3 {
		base += "0"
	}
	return base
}

// FallbackUsername suffixes a username with a short slice of the user id
// to resolve a UNIQUE collision.
func FallbackUsername(base, userID string) string {
	suffix := userID
	if len(suffix) > 6 {
		suffix = suffix[:6]
	}
	return base + "_" + suffix
}

// UpsertSignupProfile always creates the profiles row (even without
// full_name); on a upsert failure (most commonly a UNIQUE username
// collision), retries once with an id-suffixed username rather than
// orphaning the user. Returns a non-empty warning (never an error) if
// even the fallback attempt fails -- signup itself still succeeded.
func (s *AuthService) UpsertSignupProfile(ctx context.Context, userID pgtype.UUID, displayName string) (warning string) {
	err := s.q.UpsertProfileUsername(ctx, queries.UpsertProfileUsernameParams{
		ID:       userID,
		Username: pgtype.Text{String: displayName, Valid: true},
	})
	if err == nil {
		return ""
	}
	log.Printf("Signup profile upsert error, retrying with fallback username: %v", err)

	fallback := FallbackUsername(displayName, userID.String())
	err = s.q.UpsertProfileUsername(ctx, queries.UpsertProfileUsernameParams{
		ID:       userID,
		Username: pgtype.Text{String: fallback, Valid: true},
	})
	if err != nil {
		log.Printf("Signup profile upsert fallback failed: %v", err)
		return profileWarning
	}
	return ""
}

// LoginDisplayName mirrors login's display-name resolution: the saved
// profile username if present, else the same derivation signup used.
func (s *AuthService) LoginDisplayName(ctx context.Context, userID pgtype.UUID, email, metadataFullName string) string {
	profile, err := s.q.GetProfile(ctx, userID)
	if err == nil && profile.Username.Valid && profile.Username.String != "" {
		return profile.Username.String
	}
	return DeriveDisplayName(email, metadataFullName)
}
