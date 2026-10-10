# Startime

Helt ny Next.js-app med Cursor Cloud Agent-opsætning: repo-styret miljø, `install`/`start`, og dev-server til preview.

GitHub-repo: [LarrySAIndersen/Startime](https://github.com/LarrySAIndersen/Startime)

## Kør lokalt

```bash
npm ci
npm run dev
```

Appen kører på [http://localhost:4319](http://localhost:4319).

## Push til GitHub

Fra Cloud Agent (når `GH_TOKEN` har **Contents: write** eller efter `gh auth login`):

```bash
npm run push:github
```

## Cloud Agent

[`.cursor/environment.json`](.cursor/environment.json): `npm ci`, valgfri auto-push, dev-server via `.cursor/start.sh` (port **4319**).
