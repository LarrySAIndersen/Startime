# Ny applikation

Next.js-app sat op til Cursor Cloud Agent på samme måde som jeres andre Origin-projekter (fx Stardesk): repo-styret miljø, automatisk `install`/`start`, og dev-server til preview.

## Kør lokalt

```bash
npm ci
npm run dev
```

Appen kører på [http://localhost:4319](http://localhost:4319).

## Cloud Agent

Konfiguration ligger i [`.cursor/environment.json`](.cursor/environment.json):

- **`install`**: `npm ci` og forsøg på at hente reference fra `larrysanders/stardesk` på Origin
- **`start`**: starter dev-server i tmux (`dev-server`-session)
- **`repositoryDependencies`**: giver agenten adgang til reference-repos, når de er tildelt i Cursor

## Opret permanent repo

I Cursor-chatten: **Create repo**, når du er tilfreds med koden. Derefter kan du bruge **Publish** til Vercel, når integrationen er forbundet.
