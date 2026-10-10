# Startime

React + .NET 8 app til Cursor Cloud Agent.

| Del | Teknologi | Port |
|-----|-----------|------|
| Frontend | Vite, React, TypeScript | 4319 |
| Backend | ASP.NET Core Web API | 5080 |

## Kør lokalt

```bash
npm run install:all
npm run dev:api    # terminal 1
npm run dev:web    # terminal 2
```

Åbn [http://localhost:4319](http://localhost:4319). API: [http://localhost:5080/api/health](http://localhost:5080/api/health).

## Cloud Agent

[`.cursor/environment.json`](.cursor/environment.json) installerer .NET SDK, `dotnet restore`, `npm ci` i `frontend/`, og starter begge services via tmux.

## GitHub

Mål-repo: [LarrySAIndersen/Startime](https://github.com/LarrySAIndersen/Startime) — `npm run push:github` når GitHub-credentials virker.
