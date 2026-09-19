.PHONY: run build migrate-up migrate-down migrate-status sqlc tidy

run:
	go run 

build:
	go build -o

# The database url here is read from the terminal... not the env file itself
# To add the database url to the terminal, run
# export DATABASE_URL= $(grep DATABASE_URL .env | cut -d "=" -f2-) ... This is for gitbash
# For powershell, 
# $env:DATABASE_URL=(Get-Content .env | Select-String "DATABASE_URL").ToString().Split("=")[1]
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
