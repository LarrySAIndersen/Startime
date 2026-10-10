# Startime

React (Vite) + ASP.NET Core 8 — til lokal VM og Cloud Agent.

| Del | Teknologi | Port (dev) |
|-----|-----------|------------|
| Frontend | Vite, React, TypeScript | 4319 |
| Backend | ASP.NET Core Web API | 5080 |

## Lokal VM (denne maskine)

**Udvikling** (Vite med proxy til API):

```bash
bash scripts/run-local-vm.sh
```

Åbn [http://127.0.0.1:4319](http://127.0.0.1:4319). API direkte: [http://127.0.0.1:5080/api/health](http://127.0.0.1:5080/api/health).

**Deploy lokalt** (byg React, server alt fra .NET på én port):

```bash
bash scripts/deploy-local-vm.sh
# standard port 5080 — anden port: STARTIME_PORT=8080 bash scripts/deploy-local-vm.sh
```

Stop dev: `bash scripts/stop-local-vm.sh`.

## Manuel start

```bash
npm run install:all
npm run dev:api    # terminal 1
npm run dev:web    # terminal 2
```

## Cloud Agent

[`.cursor/environment.json`](.cursor/environment.json) installerer .NET SDK, `dotnet restore`, `npm ci` i `frontend/`, og starter begge services via tmux.

## GitHub

[LarrySAIndersen/Startime](https://github.com/LarrySAIndersen/Startime) — `npm run push:github` når `GH_TOKEN` er sat.
