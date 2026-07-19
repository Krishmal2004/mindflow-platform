package services

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

// AlreadySubmittedError maps to the same 409 the Express controllers
// return today, for both application-level lockouts (daily, checked in
// Go before the upsert) and the three RPC-raised X_ALREADY_SUBMITTED
// exceptions (thrive/stress/mindful, project_db.sql's advisory-lock-
// guarded submit_* functions) -- see plan §3.
type AlreadySubmittedError struct {
	Code string
}

func (e *AlreadySubmittedError) Error() string { return e.Code }

// asAlreadySubmitted maps a raw RPC error to an *AlreadySubmittedError if
// its raised message matches code, else returns err unchanged.
func asAlreadySubmitted(err error, code string) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Message == code {
		return &AlreadySubmittedError{Code: code}
	}
	return err
}
