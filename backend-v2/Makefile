.PHONY: dev build test lint sqlc

dev:
	go run ./cmd/server

build:
	go build -o bin/server ./cmd/server

test:
	go test ./...

lint:
	go vet ./...
	golangci-lint run

sqlc:
	cd internal/db && sqlc generate -f sqlc.yaml
