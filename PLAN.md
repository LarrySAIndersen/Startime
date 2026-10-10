# PLAN.md — STAR Hub absence module, build plan v1

Status: draft for development v2 · 2026-10-10 · owner: IT Operations, STAR
Design rationale (Danish): see the design document "STAR Hub – fravær: design og overvejelser".
Visual reference: `design/UI-SPEC.md` (screens, copy, tokens).

---

## 1. Scope

### In scope (phases 1–3)
- Login via STAR SSO (Keycloak), 2FA enforced by Keycloak.
- Employee: report sick / report recovered; request day off (day, period, half day); request
  vacation; edit / withdraw pending requests; cancel future approved ones; see own history.
- Manager: approve / reject (reason required); assign deputy; see team calendar with types;
  register sickness on behalf of own employee (emergency procedure).
- Deputy: acts as approver while assigned or while the manager is absent.
- Department lead: cross-team overview for teams below them.
- Admin: users, teams, managers, roles, deactivate/reactivate, send password reset link,
  reset 2FA, log out everywhere, holidays table, audit log viewer.
- Team calendar: week, month, year; staffing row; holidays and weekends shaded.
- E-mail notifications via STAR SMTP relay (outbox pattern).
- Retention jobs, audit log, access log.
- Phase 3: user/manager sync from directory via Keycloak; vacation balance from Statens HR.

### Out of scope
- Chat/channels (phase 4, separate platform: Mattermost or Element).
- Reasons for sickness, medical documentation, sickness benefit (sygedagpenge) handling.
- Payroll. Native mobile apps.

---

## 2. Repository layout

```
star-hub/
  AGENTS.md
  PLAN.md
  Makefile
  docker-compose.yml           # postgres, keycloak, mailpit
  dev/keycloak/realm-star-dev.json   # demo realm: users, roles, clients
  design/UI-SPEC.md            # screens, Danish copy, design tokens
  apps/
    web/                       # Next.js 15
      app/(auth)/login
      app/(app)/overblik
      app/(app)/kalender
      app/(app)/godkendelser
      app/(app)/admin/brugere
      app/(app)/admin/helligdage
      app/(app)/admin/log
      app/(app)/mig/log
      lib/api.ts               # typed client generated from OpenAPI
      lib/auth.ts              # BFF session, OIDC
    api/
      app/main.py
      app/config.py
      app/auth/                # JWT validation (Keycloak JWKS), current_user dependency
      app/domain/              # pure rules: visibility.py, routing.py, workdays.py, retention.py
      app/models/              # SQLAlchemy models
      app/routes/              # me.py, absences.py, approvals.py, calendar.py, admin.py, teams.py
      app/services/            # audit.py, notify.py, keycloak_admin.py, hr_sync.py
      app/worker.py            # Procrastinate app + jobs
      alembic/
      tests/
  deploy/helm/star-hub/        # web, api, worker deployments; migrate Job; ingress
```

---

## 3. Data model (PostgreSQL)

All ids are UUID v7 unless noted. All timestamps `timestamptz`. Dates are `date` in Europe/Copenhagen.

```sql
CREATE TYPE absence_type   AS ENUM ('sick','day_off','vacation');
CREATE TYPE absence_status AS ENUM ('registered','pending','approved','rejected','withdrawn','cancelled');
-- 'registered' is used only for sick.

CREATE TABLE teams (
  id uuid PRIMARY KEY,
  name text NOT NULL UNIQUE,
  parent_team_id uuid REFERENCES teams(id),
  lead_user_id uuid            -- department/team lead; FK added after users
);

CREATE TABLE users (
  id uuid PRIMARY KEY,
  keycloak_sub text NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  email text NOT NULL,
  team_id uuid REFERENCES teams(id),
  manager_id uuid REFERENCES users(id),
  active boolean NOT NULL DEFAULT true,
  deactivated_at timestamptz,
  anonymized_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Roles are NOT stored here; they come from Keycloak client roles (see §5).

CREATE TABLE deputies (
  id uuid PRIMARY KEY,
  manager_id uuid NOT NULL REFERENCES users(id),
  deputy_id uuid NOT NULL REFERENCES users(id),
  valid_from date NOT NULL,
  valid_to date,                 -- null = until removed
  CHECK (manager_id <> deputy_id)
);

CREATE TABLE absences (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  type absence_type NOT NULL,
  status absence_status NOT NULL,
  start_date date NOT NULL,
  end_date date,                 -- null only for open sick leave
  half_day boolean NOT NULL DEFAULT false,
  approver_id uuid REFERENCES users(id),     -- who it is routed to now
  decided_by uuid REFERENCES users(id),
  decided_at timestamptz,
  rejection_reason text,         -- only when status = 'rejected'
  created_by uuid NOT NULL REFERENCES users(id),  -- differs from user_id for emergency registration
  submitted_at timestamptz NOT NULL DEFAULT now(),
  escalated_at timestamptz,
  version int NOT NULL DEFAULT 1,            -- optimistic locking
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR end_date >= start_date),
  CHECK (type = 'sick' OR end_date IS NOT NULL),
  CHECK (NOT half_day OR (type = 'day_off' AND start_date = end_date)),
  CHECK ((status = 'rejected') = (rejection_reason IS NOT NULL)),
  CHECK (type <> 'sick' OR status IN ('registered','cancelled')),
  CHECK (type = 'sick' OR status <> 'registered')
);
CREATE INDEX ON absences (user_id, start_date);
CREATE INDEX ON absences (approver_id) WHERE status = 'pending';

CREATE TABLE holidays (
  date date PRIMARY KEY,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('public','state_day_off'))  -- e.g. 24/12, 31/12, grundlovsdag
);

CREATE TABLE notification_outbox (
  id uuid PRIMARY KEY,
  recipient_user_id uuid NOT NULL REFERENCES users(id),
  template text NOT NULL,        -- e.g. 'request_submitted', 'request_decided'
  link_path text NOT NULL,       -- e.g. '/godkendelser'
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed')),
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
-- No absence type, dates or free text in the outbox. Templates render generic Danish text.

CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid,                 -- null = system job
  action text NOT NULL,          -- 'absence.create', 'absence.approve', 'user.role_change', ...
  entity text NOT NULL,
  entity_id uuid,
  subject_user_id uuid,          -- whose data it concerns
  before jsonb,
  after jsonb,
  prev_hash bytea,
  hash bytea NOT NULL            -- sha256(prev_hash || canonical_json(row without hash))
);
REVOKE UPDATE, DELETE ON audit_log FROM star_hub_app;   -- app role may only INSERT/SELECT

CREATE TABLE access_log (
  id bigserial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  viewer_id uuid NOT NULL,
  subject_user_id uuid NOT NULL,
  scope text NOT NULL,           -- 'calendar', 'approvals', 'absence_detail'
  request_id text NOT NULL
);
```

---

## 4. Roles and permissions

Roles come from Keycloak client roles on client `star-hub`: `employee`, `manager`, `admin`.
"Approver" and "department lead" are derived, not roles:

- **Approver of user U on date D** = first match of:
  1. U.manager, if the manager is not absent on D and has no active deputy window covering D;
  2. the active deputy of U.manager covering D;
  3. the lead of U's team's parent team (escalation target).
- **Department lead** of U = `lead_user_id` of any ancestor team of U's team.

| Action | Employee (self) | Manager / deputy (own reports) | Dept. lead | Admin |
|---|---|---|---|---|
| Report sick / recovered | ✓ | ✓ on behalf (emergency) | – | – |
| Request day off / vacation | ✓ | – | – | – |
| Edit / withdraw pending | ✓ | – | – | – |
| Approve / reject | – | ✓ | ✓ (escalated) | – |
| See type `sick` | own | ✓ | ✓ | ✗ |
| See pending requests in calendar | own | ✓ | ✓ | ✗ |
| Calendar (masked) | own team | own teams | teams below | ✗ |
| Manage users, roles, holidays | – | – | – | ✓ |
| Read audit log | own entries | – | – | ✓ |

---

## 5. Keycloak integration

- Realm: existing STAR realm (same as star-docs). Name via env `KEYCLOAK_REALM`.
- Client `star-hub` (confidential, used by the Next.js BFF): Authorization Code + PKCE,
  redirect `https://<host>/api/auth/callback`. Access token lifetime 5 min, refresh in session.
- API validates JWT against realm JWKS: `iss`, `aud=star-hub`, `exp`; reads
  `resource_access.star-hub.roles`.
- First login: API upserts `users` row by `sub` (username, display name, email from token).
- Service account client `star-hub-admin` with `realm-management` roles `view-users`,
  `manage-users` (restrict with fine-grained permissions to the STAR Hub user group if the
  Keycloak version supports it). Used only by `services/keycloak_admin.py`:
  - reset password: `PUT /admin/realms/{realm}/users/{id}/execute-actions-email` body `["UPDATE_PASSWORD"]`, `lifespan=86400`
  - reset 2FA: delete credentials of type `otp`, then add required action `CONFIGURE_TOTP`
  - log out everywhere: `POST /admin/realms/{realm}/users/{id}/logout`
  - create user: create + `execute-actions-email` `["UPDATE_PASSWORD","CONFIGURE_TOTP","VERIFY_EMAIL"]`
  - role changes: add/remove client role mappings on `star-hub`
- Phase 3: users and managers come from the directory via Keycloak user federation
  (LDAP/AD or Entra ID brokering — decided in phase 0). Admin UI then makes name/team/manager
  read-only and shows "styres fra brugerkataloget".

---

## 6. Business rules (each needs a test named after its id)

**Working days**
- R-01 A working day is Mon–Fri and not in `holidays`. Half day counts 0.5.
- R-02 A request must contain ≥ 1 working day, else 422 `no_working_days`.

**Sick**
- R-03 Sick is created with `status=registered`, `end_date=null`, no approval.
- R-04 `start_date` may be at most 3 working days in the past and not in the future
  (employee). A manager registering on behalf may backdate up to 10 working days.
- R-05 "Meld rask" sets `end_date` to the last sick day. Default is today; the client may
  send an explicit date ≥ start_date and ≤ today (e.g. yesterday, when back at work today).
- R-06 Only one open sick leave per user. A second report while open returns 409.

**Day off / vacation**
- R-07 Created as `pending`, routed to the approver (§4) for `start_date`.
- R-08 No overlap with the user's own `pending`/`approved` day off or vacation → 409 `overlap`.
  Sick may overlap approved vacation; then the response sets `flag: sick_during_vacation`
  and the approver gets a generic notification (HR handling is out of scope).
- R-09 Half day only for `day_off` on a single date.
- R-10 Employee may edit or withdraw while `pending`. Editing an `approved` absence whose
  `start_date` is in the future resets it to `pending` and re-routes it. Past days cannot be
  edited by the employee.
- R-11 Cancel an approved future absence → `cancelled`, approver notified.

**Approval**
- R-12 Approve/reject only by the current approver (or a department lead above them).
  Nobody approves their own request.
- R-13 Reject requires `reason`, 5–500 characters, trimmed. Shown to the employee.
  The UI shows the hint: "Skriv ikke helbredsoplysninger."
- R-14 Optimistic locking: approve/reject must send `version`; mismatch → 409.
- R-15 Escalation job: a request `pending` for > 3 working days is re-routed to the
  escalation target once (`escalated_at` set) and both parties are notified.
- R-16 If the approver is absent (sick or approved absence) on the day a request arrives,
  it routes to the deputy; if none, to the escalation target.

**Visibility** (implemented once in `domain/visibility.py`)
- R-17 `can_see_type(viewer, subject, date)` is true if viewer == subject, or viewer is
  approver/deputy/department lead of subject on that date.
- R-18 Without `can_see_type`, sick is returned as `absent`; `pending`, `rejected`,
  `withdrawn` are not returned at all; `rejection_reason` is never returned.
- R-19 Admin role grants no absence visibility.
- R-20 Every API response that returns a `sick` type for a subject ≠ viewer writes one
  `access_log` row per subject per request.

**Admin**
- R-21 There must always be ≥ 1 active user with role `admin`; the last one cannot be
  deactivated or lose the role (409 `last_admin`).
- R-22 Deactivate = Keycloak user disabled + `users.active=false`; their pending requests are
  withdrawn, their deputy windows end, their direct reports are flagged in admin UI
  "mangler leder".
- R-23 Usernames are lowercase `[a-z0-9._-]+`, unique.

**Retention** (daily job 02:00, every deletion audited with counts only)
- R-24 Sick absences: hard delete 12 months after `end_date`.
- R-25 Day off / vacation: delete when the holiday year has ended (31 Dec of the year after
  the 1 Sep–31 Aug accrual year containing `start_date`).
- R-26 Rejected / withdrawn / cancelled: delete 3 months after `updated_at`.
- R-27 Deactivated users: anonymize (`display_name='Tidligere medarbejder'`, clear e-mail and
  username) 12 months after `deactivated_at`.
- R-28 `access_log` and `audit_log`: delete rows older than 3 years (only this job may delete;
  it runs as a separate DB role).
All periods are config values (`RETENTION_*`), default as above, pending DPO approval.

**Notifications** (outbox, sent by worker, retried 5× with backoff)
- R-29 Templates: `request_submitted` (to approver), `request_decided` (to employee),
  `request_escalated`, `absence_reported` (to approver when a report is sick; text says only
  "Der er registreret fravær i dit team"), `welcome` handled by Keycloak.
- R-30 No template may contain the absence type, dates, names of other people, or free text.
  Subject is always "STAR Hub: Der er nyt til dig". Body: one generic Danish sentence + link.
- R-31 A user can opt out of e-mail for `request_decided`; approvers cannot opt out of
  `request_submitted`.

---

## 7. API (FastAPI, `/api/v1`, JSON, OpenAPI generated)

```
GET    /me                                   -> user, roles, team, manager, deputy windows
GET    /me/absences?from&to                  -> own absences (all statuses)
GET    /me/log                               -> own audit + access log entries

POST   /absences/sick                        {start_date}                     R-03..R-06
POST   /absences/sick/{id}/recover           {end_date?}                      R-05
POST   /absences/sick/on-behalf              {user_id, start_date}            manager only, R-04
POST   /absences/requests                    {type, start_date, end_date, half_day}  R-07..R-09
PATCH  /absences/requests/{id}               {start_date, end_date, half_day, version} R-10
POST   /absences/requests/{id}/withdraw      {version}
POST   /absences/{id}/cancel                 {version}                        R-11
GET    /absences/preview?start&end           -> {working_days, overlap:[{name, kind}], min_staffing}
                                                (overlap kinds masked per R-17/R-18)

GET    /approvals?status=pending|decided     -> items with overlap + min staffing if approved
POST   /approvals/{id}/approve               {version}
POST   /approvals/{id}/reject                {version, reason}                R-13

GET    /calendar?team_id&from&to             -> {days:[{date, working, holiday_name}],
                                                 rows:[{user_id, name, cells:[{date, kind, pending, half}]}],
                                                 staffing:[{date, present, total}]}
                                                kind ∈ {null, sick, absent, day_off, vacation}
GET    /calendar/year?team_id&year           -> per user per month counts (masked), min staffing per month
GET    /teams                                -> teams visible to caller

GET    /deputies                             -> caller's deputy windows (as manager)
PUT    /deputies                             [{deputy_id, valid_from, valid_to}]

GET    /admin/users?q&status&team_id
POST   /admin/users                          {username, display_name, email, team_id, manager_id, roles[]}
PATCH  /admin/users/{id}                     {display_name?, team_id?, manager_id?, roles?, active?}
POST   /admin/users/{id}/reset-password
POST   /admin/users/{id}/reset-2fa
POST   /admin/users/{id}/logout-all
GET    /admin/teams | POST | PATCH
GET    /admin/holidays?year | PUT /admin/holidays/{date} | DELETE
GET    /admin/audit?actor&subject&action&from&to

GET    /healthz   GET /readyz
```

Errors: RFC 9457 problem+json with a stable `code` (`overlap`, `no_working_days`,
`version_conflict`, `last_admin`, `not_approver`, `reason_required`, …) and Danish `detail`.

---

## 8. Screens (Danish UI; details in `design/UI-SPEC.md`)

| Route | Who | Content |
|---|---|---|
| `/login` | all | "Log ind med STAR-konto" → Keycloak. Emergency text: "Kan du ikke logge ind? Ring eller sms til din leder." |
| `/overblik` | all | Greeting + date; cards "Meld syg", "Anmod om fri", "Ferieønske"; "Holdet i dag"; "Mine anmodninger og fravær" with actions; "Min ferie" (phase 3); manager banner "N anmodninger venter" |
| modal "Meld syg" | employee | Only start date (default today). Text: "Du skal ikke oplyse årsag." Button "Meld syg" |
| modal "Anmod om fri" / "Ferieønske" | employee | Type, from, to, half day (day off only), live preview: working days + "Allerede væk i perioden" from `/absences/preview` |
| `/kalender` | all | Team picker; tabs Uge / Måned / År; prev / I dag / next; legend; staffing row; year cells link to month |
| `/godkendelser` | approvers | Pending list with overlap + min staffing; "Se i kalender", "Afvis" (reason dialog, required), "Godkend"; "Behandlet" with undo within 10 minutes (= new decision, audited) |
| `/indstillinger/stedfortraeder` | managers | Add/remove deputy windows |
| `/admin/brugere` | admin | Search, filter Aktive/Deaktiverede/Alle, table, edit dialog (team, manager, roles, active), security actions |
| `/admin/helligdage` | admin | Year list, add/remove |
| `/admin/log` | admin | Filterable audit log |
| `/mig/log` | all | Who changed or viewed my data |

Mobile: the sick flow must work in 2 taps after login on a 390 px wide screen.

---

## 9. Phases and tasks

Each task: one PR, tests included, acceptance criteria met, `make lint test` green.

### Phase 0 — foundations (no business features)
- **P0-01** Monorepo skeleton per §2, Makefile, docker-compose (postgres 16, keycloak, mailpit), dev realm with users: `medarbejder1..4`, `leder1`, `afdelingsleder1`, `admin1`.
  *AC:* `make dev` starts everything; login works for all demo users.
- **P0-02** API: config, JWT validation, `current_user` dependency, user upsert on first call, `/me`, `/healthz`, `/readyz`.
  *AC:* invalid/expired token → 401; roles read from client roles; tests.
- **P0-03** Web: BFF session with Keycloak, protected layout, header with name + "Log ud", Danish shell and nav per prototype. Telemetry off, fonts self-hosted.
  *AC:* no request to non-STAR hosts in the browser network tab (Playwright asserts it).
- **P0-04** Alembic baseline with §3 schema; DB roles `star_hub_app` (no UPDATE/DELETE on audit_log) and `star_hub_retention`.
  *AC:* migration up/down in CI against testcontainer.
- **P0-05** `audit.record()` with hash chain + verification command `python -m app.tools.verify_audit`.
  *AC:* tampering with a row is detected in test.
- **P0-06** Helm chart: web, api, worker deployments; `migrate` Job (pre-upgrade hook); ingress with TLS; NetworkPolicy (only api → postgres; only worker → SMTP/Keycloak admin); resource limits; non-root, read-only FS.
  *AC:* `helm template` passes kubeconform; no secrets in values.

### Phase 1 — MVP (pilot IT Operations)
- **P1-01** `domain/workdays.py` + holidays seed for current and next year (incl. 24/12, 31/12, 5/6). R-01, R-02.
- **P1-02** Sick: report, recover, on-behalf. R-03..R-06. Overblik card + mobile modal.
- **P1-03** Requests: create/edit/withdraw/cancel. R-07..R-11. Modal with preview endpoint.
- **P1-04** Routing to approver (manager only in phase 1; deputy in P2-01). R-12, R-14.
- **P1-05** Approvals page: approve, reject with required reason. R-13. Overlap + min staffing per item.
- **P1-06** `domain/visibility.py` + access_log. R-17..R-20. Property-based tests over role/relationship combinations.
- **P1-07** Week calendar for own team with staffing row.
- **P1-08** Outbox + worker + SMTP sending + templates. R-29, R-30.
- **P1-09** "Mine anmodninger og fravær" + `/mig/log`.
- **P1-10** E2E happy paths: sick → recover; request → approve; request → reject (reason shown); edit approved → pending again.
  *Phase AC:* pentest-ready build; no personal data in logs (log scraper test); WCAG check with axe in Playwright, zero serious violations.

### Phase 2 — management and operations
- **P2-01** Deputy windows + auto-routing when manager absent. R-16.
- **P2-02** Escalation job. R-15.
- **P2-03** Month and year calendar, team picker, department-lead cross-team view.
- **P2-04** Admin users: list, create, edit, deactivate, roles via Keycloak admin API, security actions. R-21..R-23.
- **P2-05** Admin holidays, admin audit log viewer.
- **P2-06** Retention job. R-24..R-28. Dry-run mode with counts.
- **P2-07** Notification preferences. R-31.

### Phase 3 — integrations
- **P3-01** Directory sync: users/teams/managers read-only from Keycloak federation; admin UI shows source.
- **P3-02** Statens HR: read vacation balance per holiday year (integration method decided in phase 0; if none, CSV import job). "Min ferie" card shows balance from HR, never computed.
- **P3-03** Optional: export approved absences to Statens HR (only if HR confirms the route).

---

## 10. Configuration (env)

```
APP_BASE_URL, TZ=Europe/Copenhagen
DATABASE_URL, DATABASE_URL_RETENTION
KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID=star-hub, KEYCLOAK_CLIENT_SECRET
KEYCLOAK_ADMIN_CLIENT_ID=star-hub-admin, KEYCLOAK_ADMIN_CLIENT_SECRET
SMTP_HOST, SMTP_PORT, SMTP_FROM=no-reply@star.dk, SMTP_STARTTLS=true
SESSION_SECRET
ESCALATION_WORKING_DAYS=3
SICK_BACKDATE_EMPLOYEE_DAYS=3, SICK_BACKDATE_MANAGER_DAYS=10
RETENTION_SICK_MONTHS=12, RETENTION_DECLINED_MONTHS=3, RETENTION_USER_MONTHS=12, RETENTION_LOG_YEARS=3
NEXT_TELEMETRY_DISABLED=1
```

---

## 11. Definition of done (every PR)

- Tests for every touched rule id pass; coverage of `app/domain` ≥ 90 %.
- `ruff`, `mypy --strict` (domain + services), `eslint`, `tsc --noEmit` clean.
- No new runtime dependency without approval; no outbound host outside STAR infra.
- Danish UI text reviewed for tone: short, plain, no blame ("Du skal ikke oplyse årsag.").
- Audit entries written for every state change; no personal data in logs.

## 12. Open decisions (do not implement until resolved)

1. Directory source for users/managers (AD via LDAP federation or Entra ID brokering).
2. Statens HR integration route and whether STAR Hub becomes the feeding system.
3. Retention periods and visibility (DPO sign-off).
4. Escalation period (HR + management).
5. Chat platform for phase 4.
