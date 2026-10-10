.PHONY: dev dev-infra api web test lint migrate down

COMPOSE := docker compose

dev-infra:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

api:
	cd apps/api && uvicorn app.main:app --reload --host 0.0.0.0 --port 5080

web:
	cd apps/web && NEXT_TELEMETRY_DISABLED=1 npm run dev -- --hostname 0.0.0.0 --port 4319

# Starts infra, then API and web (requires Docker for postgres/keycloak/mailpit).
dev: dev-infra
	@echo "Waiting for Keycloak (http://127.0.0.1:8080)…"
	@sleep 8
	$(MAKE) -j2 api web

test:
	cd apps/api && python -m pytest -q

lint:
	cd apps/api && ruff check app tests && ruff format --check app tests
	cd apps/web && npm run lint
	cd apps/web && npm exec tsc -- --noEmit

migrate:
	@echo "Alembic migrations land in P0-04; run from apps/api when available."
