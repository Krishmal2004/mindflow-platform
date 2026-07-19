// Package testutil provides a real, disposable Postgres instance for
// integration tests -- see plan §7's testcontainers-go approach: sqlc's
// generated code has no natural mocking seam the way the Supabase-JS
// mock (backend/tests/helpers/supabaseMock.ts) does, so tests that need
// real SQL semantics (RLS-adjacent FKs, RPC/advisory-lock behavior) run
// against a real container instead.
package testutil

import (
	"context"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db/queries"
)

// NewTestDB spins up a disposable Postgres container seeded with a
// minimal auth.users/auth.uid() stand-in (fixtures/auth_schema.sql,
// Supabase-managed in production, absent from a vanilla Postgres image)
// followed by the real schema (database/project_db.sql, the repo's
// single source of truth -- referenced directly, never copied). Returns
// a connected pool and sqlc Queries; both are torn down via t.Cleanup.
func NewTestDB(t *testing.T) (*pgxpool.Pool, *queries.Queries) {
	t.Helper()
	ctx := context.Background()

	_, thisFile, _, _ := runtime.Caller(0)
	thisDir := filepath.Dir(thisFile)
	authFixture := filepath.Join(thisDir, "fixtures", "auth_schema.sql")
	schemaPath := filepath.Join(thisDir, "..", "..", "..", "database", "project_db.sql")

	pgContainer, err := tcpostgres.Run(ctx, "postgres:17",
		tcpostgres.WithDatabase("testdb"),
		tcpostgres.WithUsername("postgres"),
		tcpostgres.WithPassword("postgres"),
		tcpostgres.WithInitScripts(authFixture, schemaPath),
		tcpostgres.BasicWaitStrategies(),
	)
	if err != nil {
		t.Fatalf("starting postgres container: %v", err)
	}
	t.Cleanup(func() {
		if err := pgContainer.Terminate(context.Background()); err != nil {
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
	t.Cleanup(pool.Close)

	return pool, queries.New(pool)
}
