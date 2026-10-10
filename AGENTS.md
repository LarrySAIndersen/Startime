# AGENTS.md — STAR Hub (absence module)

Instructions for AI coding agents (Cursor, Claude Code) working in this repository.
Read this file and `PLAN.md` before every task. `PLAN.md` is the source of truth for scope,
data model, rules and acceptance criteria.

## What this is

STAR Hub is STAR's own web app for registering sickness, days off and vacation, with manager
approval. It replaces sick reporting in Slack. It must run entirely on STAR's EU infrastructure
(STARCloud, Kubernetes on Hetzner). Later it will plug into a self-hosted chat platform.

## Non-negotiables (a PR that breaks one of these is rejected)

1. **No US-owned SaaS in the data path.** Do not add Vercel, Neon, Supabase, Firebase, Auth0,
   Clerk, Sentry SaaS, Datadog, PostHog cloud, Google Analytics, SendGrid, Mailgun, Twilio,
   Algolia, OpenAI/Anthropic/other LLM APIs, or any CDN-hosted script/font at runtime.
   Self-host fonts. If a dependency phones home (telemetry), disable it or don't use it.
   Next.js telemetry must be off (`NEXT_TELEMETRY_DISABLED=1`).
2. **Never collect a reason for sickness.** No free-text field anywhere in the sick flow.
   No "comment" field on any absence created by an employee.
3. **Never log personal data.** Logs may contain user UUIDs and request ids — never names,
   e-mails, absence types, dates of absence, or rejection reasons.
4. **Authorization lives in the API.** The web app hides things for UX, but every rule is
   enforced in the backend (this repo: **ASP.NET Core**). Never trust role claims sent from the browser.
5. **Sick is masked.** Only the subject, their approvers (manager, active deputy, department
   lead) see type `sick`. Everyone else sees `absent`. Admins see no absence types at all.
   Use the single visibility function (`VisibilityService.cs` in this repo) — never re-implement it.
6. **Every write is audited** through `audit.record(...)` in the same transaction.
   Every read of another person's sick data is written to `access_log`.
7. **Migrations run only via Alembic as a separate Kubernetes Job.** Never run migrations on
   app start-up.
8. **Notifications never contain the word "syg"/"sick", absence types, or free text.**
   They say something changed and link to the app.
9. **Passwords are never set or seen by admins.** Use Keycloak `execute-actions-email`.

## Working style

- One task id from `PLAN.md` per branch/PR (e.g. `P1-04`). Keep PRs small.
- Write tests first for every business rule (`R-xx` ids in `PLAN.md`); name tests after the rule
  (`test_R07_rejection_requires_reason`).
- Do not change files under `deploy/`, `.env*`, Keycloak realm exports, or CI config without the
  human explicitly asking. Propose the change in the PR description instead.
- If `PLAN.md` is ambiguous, stop and write the question in the PR description; do not guess
  on rules, roles or retention.
- Prefer boring, well-known libraries. Ask before adding a new runtime dependency.

## Stack (this repository — Startime on GitHub)

- `frontend/`: Vite, React, TypeScript. Demo login until Keycloak BFF lands.
- `backend/Startime.Api/`: ASP.NET Core 8, EF Core (SQLite demo; PostgreSQL planned).
- Production target remains `PLAN.md`: Keycloak, PostgreSQL, outbox worker, EU hosting.
- Human-readable policy: `docs/PRINCIPPER-OG-DATABESKYTTELSE.md`. Demo steps: `docs/DEMO-VEJLEDNING.md`.

## UI rules

- All user-facing text in Danish. Code, identifiers and comments in English.
- WCAG 2.1 AA: real `<button>`/`<a>`/`<label>`, visible focus, 4.5:1 contrast, 44px touch targets.
- Respect `prefers-reduced-motion` for every animation.
- Mobile browser first for the sick flow (two taps from login to "meldt syg").
- Colours: STAR blue `#003087`, red `#C8102E` (sick), turquoise `#00C7B1` (day off),
  blue tint `#E6EBF4`, grey `#F0EEEB`, muted text `#595959`. Use the HTML prototypes in
  `design/UI-SPEC.md` as the visual reference.

## Commands

```bash
make dev        # docker compose up (postgres, keycloak, mailpit) + web + api + worker
make test       # api unit + integration tests
make e2e        # playwright against compose stack
make lint       # ruff, mypy, eslint, tsc
make migrate    # alembic upgrade head (local only)
```
