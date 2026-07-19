// Package db builds and configures the pgxpool connection pool used for
// direct Postgres access (see plans/backend-go-migration.md §3).
package db

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	maxConns        = 25
	minConns        = 5
	maxConnLifetime = 45 * time.Minute
	maxConnIdleTime = 5 * time.Minute
	pingTimeout     = 5 * time.Second
)

// NewPool builds a pgxpool.Pool sized for the ~1000-concurrent-user target
// and pings it immediately so a misconfigured/unreachable DATABASE_URL fails
// fast at startup instead of surfacing lazily on the first request.
func NewPool(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	poolCfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parsing DATABASE_URL: %w", err)
	}

	poolCfg.MaxConns = maxConns
	poolCfg.MinConns = minConns
	poolCfg.MaxConnLifetime = maxConnLifetime
	poolCfg.MaxConnIdleTime = maxConnIdleTime

	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		return nil, fmt.Errorf("creating connection pool: %w", err)
	}

	pingCtx, cancel := context.WithTimeout(ctx, pingTimeout)
	defer cancel()

	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("pinging database: %w", err)
	}

	return pool, nil
}
