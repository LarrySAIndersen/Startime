# Ny applikation

Helt ny Next.js-app med Cursor Cloud Agent-opsætning som jeres andre Origin-projekter: repo-styret miljø, `install`/`start`, og dev-server til preview. Ingen delt kodebase med Stardesk eller andre apps.

## Kør lokalt

```bash
npm ci
npm run dev
```

Appen kører på [http://localhost:4319](http://localhost:4319).

## Cloud Agent

Konfiguration i [`.cursor/environment.json`](.cursor/environment.json):

- **`install`**: `npm ci`
- **`start`**: starter dev-server i tmux (`dev-server`-session)

## Opret permanent repo

I Cursor-chatten: **Create repo**, når du er tilfreds med koden. Derefter kan du bruge **Publish** til Vercel, når integrationen er forbundet.
