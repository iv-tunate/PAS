.PHONY: run build migrate-up migrate-down migrate-status sqlc tidy

run:
	go run 

build:
	go build -o

migrate-up:
	goose -dir internal/db/migrations postgres "$$DATABASE_URL" up

migrate-down:
	goose -dir internal/db/migrations postgres "$$DATABASE_URL" down

migrate-status:
	goose -dir internal/db/migrations postgres "$$DATABASE_URL" status

sqlc:
	sqlc generate

tidy:
	go mod tidy
