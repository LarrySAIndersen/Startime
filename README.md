# Startime — STAR Hub fravær

React (Vite) + ASP.NET Core 8. Funktionsomfang og regler: [`PLAN.md`](PLAN.md).

| Dokument | Indhold |
|----------|---------|
| [`docs/PRINCIPPER-OG-DATABESKYTTELSE.md`](docs/PRINCIPPER-OG-DATABESKYTTELSE.md) | Databeskyttelse, non-negotiables, retention, demo vs. prod |
| [`docs/DEMO-VEJLEDNING.md`](docs/DEMO-VEJLEDNING.md) | Scenarie-for-scenarie demo af alle funktioner |
| [`design/UI-SPEC.md`](design/UI-SPEC.md) | Dansk UI og design tokens |
| [`AGENTS.md`](AGENTS.md) | Krav til AI/udviklere |

**GitHub:** [LarrySAIndersen/Startime](https://github.com/LarrySAIndersen/Startime)

## Hurtig demo (én port)

```bash
git clone https://github.com/LarrySAIndersen/Startime.git
cd Startime
bash scripts/deploy-local-vm.sh
```

→ [http://127.0.0.1:5080/login](http://127.0.0.1:5080/login)

Nulstil data: `bash scripts/reset-demo-db.sh && bash scripts/deploy-local-vm.sh`

## Udvikling

| Del | Port |
|-----|------|
| Vite (`scripts/run-local-vm.sh`) | 4319 |
| API | 5080 |

```bash
npm run install:all
npm run local:dev      # tmux: api + web
npm run local:deploy   # production-like single port
npm run local:stop
```

## Push til GitHub

Sæt classic PAT med `repo` som secret **`GH_TOKEN`** (Cursor Environment) eller:

```bash
npm run push:github
```

## Bevidst udskudt

Keycloak BFF + JWT og PostgreSQL/migrations-job — se princip-dokumentet §8–§9.
