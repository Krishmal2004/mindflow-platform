# backend-v2

Go (Gin) rewrite of `backend/`, built in parallel per
`plans/backend-go-migration.md`. Not yet a replacement for `backend/` — see
that plan for phased scope, cutover criteria, and architectural decisions.

## Status

Phase 1 only: skeleton + `GET /health`. No auth, no business endpoints yet —
those land in later phases per the migration plan.

## Development

Requires Go 1.25+ and a reachable Postgres (`DATABASE_URL`).

```bash
cp .env.example .env   # fill in DATABASE_URL and SUPABASE_URL
make dev                # go run ./cmd/server
```

```bash
curl http://localhost:3000/health
```

## Commands

- `make dev` — run the server with `go run`.
- `make build` — build `bin/server`.
- `make test` — `go test ./...`.
- `make lint` — `go vet` + `golangci-lint`.
