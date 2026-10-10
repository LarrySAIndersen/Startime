# STAR Hub (Startime repo)

STAR Hub er STARs egen webapp til fravær (sygdom, fri og ferie). Monorepo efter `PLAN.md` og `AGENTS.md`.

| Del | Teknologi | Port (lokal) |
|-----|-----------|--------------|
| Web | Next.js 15 (App Router), TypeScript, Tailwind | 4319 |
| API | Python 3.12, FastAPI | 5080 |
| Infra (dev) | Docker Compose: PostgreSQL 16, Keycloak, Mailpit | 5432 / 8080 / 8025 |

Designreference: [`design/UI-SPEC.md`](design/UI-SPEC.md).

## Kom i gang

```bash
cp .env.example .env
make dev-infra   # kræver Docker
make dev         # infra + API + web (parallel)
```

Uden Docker (kun UI + API-stub i Cloud Agent):

```bash
python3 -m pip install -r apps/api/requirements.txt
npm ci --prefix apps/web
cd apps/api && uvicorn app.main:app --host 0.0.0.0 --port 5080
cd apps/web && AUTH_DEV_BYPASS=1 npm run dev -- --hostname 0.0.0.0 --port 4319
```

Åbn [http://127.0.0.1:4319](http://127.0.0.1:4319). Med Keycloak: log ind som fx `leder1` / `StarDev1!` (realm `star-dev`).

## Kvalitet

```bash
make lint
make test
```

## GitHub

Kode pushes til [LarrySAIndersen/Startime](https://github.com/LarrySAIndersen/Startime) via `scripts/push-to-github.sh` (kræver `GH_TOKEN` i miljøet).

## Status

- **Fase 0 (igang):** monorepo-skelet, UI-shell (overblik, login), API health + dev `/me`. Keycloak BFF og JWT (P0-02/P0-03) og Alembic (P0-04) følger i næste tasks.
