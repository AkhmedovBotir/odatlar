.PHONY: run build swagger tidy docker-up docker-down create-admin

run:
	go run ./cmd/api

build:
	go build -o bin/api ./cmd/api

swagger:
	swag init -g cmd/api/main.go -o docs --parseDependency --parseInternal

tidy:
	go mod tidy

docker-up:
	docker compose up -d

docker-down:
	docker compose down

create-admin:
	go run ./cmd/create-admin
