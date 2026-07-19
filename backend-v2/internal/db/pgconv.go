package db

import (
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
)

// FormatTime converts a Postgres TIME column into an "HH:MM:SS" string
// (matching what PostgREST/Supabase's REST API would return), or nil for
// NULL. pgtype.Time has no MarshalJSON of its own (unlike Text, Int4,
// Bool, Timestamptz, and Date, which self-serialize correctly) -- passed
// through unconverted, it leaks its internal {Microseconds, Valid}
// struct fields into API responses instead.
func FormatTime(t pgtype.Time) *string {
	if !t.Valid {
		return nil
	}
	totalSeconds := t.Microseconds / 1_000_000
	s := fmt.Sprintf("%02d:%02d:%02d", totalSeconds/3600, (totalSeconds/60)%60, totalSeconds%60)
	return &s
}

// ParseUUID converts a JWT "sub" claim (a UUID string) into pgtype.UUID for
// use as a sqlc query parameter.
func ParseUUID(s string) (pgtype.UUID, error) {
	var id pgtype.UUID
	if err := id.Scan(s); err != nil {
		return pgtype.UUID{}, fmt.Errorf("parsing UUID %q: %w", s, err)
	}
	return id, nil
}

// TextPtr converts a nullable Postgres text column into a Go string
// pointer, matching how Supabase's JS client already surfaces NULL as
// null/undefined to the services ported from it.
func TextPtr(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	return &t.String
}

// OptionalText converts a Go string pointer into a nullable Postgres text
// param -- the write-side inverse of TextPtr.
func OptionalText(s *string) pgtype.Text {
	if s == nil {
		return pgtype.Text{}
	}
	return pgtype.Text{String: *s, Valid: true}
}

// OptionalInt4 converts a Go int32 pointer into a nullable Postgres int4
// param -- the write-side inverse of the Int4.Valid pattern.
func OptionalInt4(v *int32) pgtype.Int4 {
	if v == nil {
		return pgtype.Int4{}
	}
	return pgtype.Int4{Int32: *v, Valid: true}
}
