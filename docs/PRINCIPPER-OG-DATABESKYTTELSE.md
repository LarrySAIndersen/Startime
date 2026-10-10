# STAR Hub — principper, beslutninger og databeskyttelse

Dette dokument samler **bindende principper** og **beslutninger** for STAR Hub fraværsmodulet.
Det supplerer `PLAN.md` (funktionsomfang og regler) og `AGENTS.md` (krav til udvikling).
Ved uenighed mellem implementering og dette dokument vinder **PLAN.md** på forretningsregler og
**dette dokument** på databeskyttelse og driftspolitik, indtil DPO/juridisk godkender andet.

**Implementering i dette repo:** React (Vite) + ASP.NET Core 8. Keycloak og PostgreSQL
introduceres senere; demo kører med **demo-login** og **SQLite** (se nederst).

---

## 1. Formål og dataansvar

STAR Hub behandler personoplysninger om medarbejdere i forbindelse med **sygemelding, fri og ferie**.
Behandlingen skal understøtte arbejdsgiverens pligtige processer uden at indsamle **unødig
helbreds- eller fraværsbegrundelse**.

- **Formål:** planlægning, godkendelse og dokumentation af fravær internt i STAR.
- **Grundlag:** typisk arbejdsgivers legitime interesse og/eller kontraktopfyldelse; endelig
  vurdering og dokumentation af retsgrundlag ligger hos STAR/DPO.
- **Placering:** produktion kører på **STARs EU-infrastruktur** (STARCloud / Hetzner). Ingen
  behandling i US-ejet SaaS i datapath (se §2).

---

## 2. Tekniske og organisatoriske non-negotiables

Disse punkter er **afvisningskriterier** for kode og arkitektur (jf. `AGENTS.md`):

| # | Princip |
|---|---------|
| N1 | **Ingen US-ejet SaaS i datapath** (Vercel, Neon, Auth0, Clerk, Sentry/Datadog/PostHog cloud, SendGrid, GA, eksterne LLM-API’er, CDN-fonte/scripts med tredjeparts-tracking). Fonte self-hostes. |
| N2 | **Ingen årsag til sygdom** — ingen fritekst, kommentarfelt eller “begrundelse” i syg-flow. |
| N3 | **Ingen persondata i applikationslogs** — kun UUID’er og request-id; aldrig navne, e-mail, fraværstype, datoer eller afvisningsbegrundelser i log output. |
| N4 | **Autorisation i API’et** — UI skjuler kun for UX; regler håndhæves server-side. Browserens rolle-claims er ikke tillidspålidelige. |
| N5 | **Sygdom maskeres** — kolleger ser `fraværende`; kun den syge, godkender/stedfortræder og relevant afdelingsleder ser `syg`. Administratorer ser **ikke** fraværstyper. Én visibility-funktion (i .NET: `VisibilityService`). |
| N6 | **Audit ved skriv** — hver tilstandændring auditeres; læsning af andres syg-data logges i `access_log` (produktionsmål; demo kan være delvis). |
| N7 | **Migrationer** kører som **separat job** (Kubernetes Job / pipeline), ikke ved app-opstart. |
| N8 | **Notifikationer** må ikke indeholde “syg”, fraværstype, datoer, navne på andre eller fritekst — kun generisk dansk tekst + link til appen. |
| N9 | **Adgangskoder** håndteres kun i **Keycloak** (`execute-actions-email`); administratorer ser/sætter aldrig passwords. |

---

## 3. Dataminimering og særlige kategorier

- **Sygdom:** kun startdato (og slut ved raskmelding). **Ingen** diagnose, symptomer eller “hvorfor”.
- **Fri/ferie:** periode, evt. halv dag (kun fri). Ingen medarbejderkommentar på anmodninger.
- **Afvisning:** leder skal angive **begrundelse** (5–500 tegn) til medarbejderen; UI-hint:
  *“Skriv ikke helbredsoplysninger.”* Begrundelsen gemmes knyttet til anmodningen, ikke i logs.
- **Særlige kategorier (GDPR art. 9):** sygdom kan i praksis røre helbredsoplysninger. STAR
  minimerer indhold (ingen årsag) og begrænser synlighed (maskering). **Konsekvensanalyse /
  DPO-godkendelse** af løsningen er STARs ansvar; retention nedenfor er **defaults** pending DPO.

---

## 4. Synlighed og adgang (R-17–R-20)

- **Medarbejder:** eget fravær fuldt; teamkalender maskeret for kollegers sygdom.
- **Leder / stedfortræder:** ser type for egne medarbejdere; godkender fri/ferie.
- **Afdelingsleder:** udvidet overblik for teams under sig (PLAN §4).
- **Administrator:** brugere, roller, helligdage, audit — **ingen** sygdomsoversigt.
- **Access log:** når API returnerer `sick` for anden person end viewer, skal det logges (scope
  fx `calendar`, `absence_detail`).

---

## 5. Logging, audit og integritet

- **Audit log:** handlings-id (`absence.create`, `absence.approve`, …), actor/subject UUID,
  entity-id, before/after JSON uden unødig fritekst. Hash-kæde planlagt (PLAN P0-05); demo har
  forenklet SHA256-kæde i `AuditService`.
- **Applikationslogs:** struktureret, uden personidentificerende felter (N3).
- **Audit log immutability:** DB-rolle `star_hub_app` må ikke UPDATE/DELETE på `audit_log`
  (PostgreSQL i produktion).

---

## 6. Opbevaring og sletning (retention)

Defaults fra `PLAN.md` §6 (R-24–R-28) — **endelige perioder afventer DPO**:

| Data | Default | Ansvarlig job |
|------|---------|----------------|
| Sygdom (efter afsluttet) | 12 mdr. | `star_hub_retention` |
| Afvist/trukket tilbage/annulleret | 3 mdr. | retention job |
| Fri/ferie | efter ferieår (1. sep–31. aug logik) | retention job |
| Deaktiverede brugere | anonymisering 12 mdr. efter deaktivering | retention job |
| `access_log` / `audit_log` | 3 år | retention job (særskilt DB-rolle) |

Konfiguration via `RETENTION_*` env (produktion). **Retention-job er ikke aktiveret i demo.**

---

## 7. Notifikationer og e-mail

- **Outbox-mønster:** API skriver kun generiske poster; worker sender via STAR SMTP relay.
- **Emne (produktion):** fx *“STAR Hub: Der er nyt til dig”*.
- **Indhold:** én generisk sætning + link — ingen fraværstype, datoer eller “syg”.
- **Præferencer (R-31):** medarbejder kan fravælge `request_decided`; godkender kan ikke
  fravælge `request_submitted`.

Demo: poster oprettes i `notification_outbox`; **ingen mail sendes**, medmindre SMTP sættes op.

---

## 8. Autentifikation og session

**Produktion (besluttet retning):**

- Keycloak (STAR SSO), 2FA via IdP.
- Next.js/BFF eller tilsvarende: Authorization Code + PKCE, tokens i **httpOnly session** —
  ikke localStorage.
- API validerer JWT (JWKS, `aud`, `exp`), roller fra `resource_access.star-hub.roles`.

**Demo (dette repo indtil Keycloak):**

- Bruger vælges på `/login`; `X-Demo-User-Id` sendes til API.
- **Kun til udvikling/demo** — må ikke bruges i produktion.
- Fiktive brugere (`*.star.dev.local`); ingen rigtige medarbejderdata i seed.

---

## 9. Database og migrationer

**Produktion (planlagt):**

- PostgreSQL 16, schema jf. `PLAN.md` §3.
- Alembic/EF-migrationer køres som **separat deploy-job**, aldrig automatisk ved pod start.

**Demo (nu):**

- SQLite fil: `STARHUB_DB` eller `/workspace/.local/starhub.db`.
- `EnsureCreated` + seed — **ikke** produktionsparitet; velegnet til funktionsdemo.

---

## 10. Demo vs. produktion — ærlig status

| Emne | Demo (GitHub / VM) | Produktion (mål) |
|------|--------------------|-------------------|
| Login | Brugervalg | Keycloak + 2FA |
| Database | SQLite | PostgreSQL + migration job |
| Access log | Delvis | Fuld dækning |
| E-mail | Outbox kun | SMTP worker |
| Retention | Slået fra | Cron/job kl. 02:00 |
| HR-saldo | Placeholder UI | Statens HR (fase 3) |

---

## 11. Åbne beslutninger (implementer ikke før afklaring)

Fra `PLAN.md` §12:

1. Directory-kilde for brugere/ledere (LDAP/AD vs. Entra brokering).
2. Statens HR integration og om STAR Hub er master for eksport.
3. Endelige retention-perioder og synlighed (DPO).
4. Eskaleringsperiode (HR/ledelse).
5. Chat-platform fase 4 (Mattermost/Element).

---

## 12. Referencer i kodebasen

| Emne | Sted |
|------|------|
| Forretningsregler R-01… | `PLAN.md` §6, `AbsenceService`, `WorkdayCalculator` |
| Maskering | `VisibilityService.cs` |
| Audit | `AuditService.cs`, `/api/v1/admin/audit` |
| Demo-auth | `DemoAuthMiddleware.cs`, `frontend/src/api/client.ts` |
| UI-copy | `design/UI-SPEC.md` |
| Agent-krav | `AGENTS.md` |

---

## 13. Vedligehold

- Opdater dette dokument når DPO, sikkerhed eller arkitektur træffer nye beslutninger.
- Versionering i git; større ændringer bør nævnes i release notes / PR.

*Senest alignet med PLAN v1 · 2026-10-10 · stack React + .NET i Startime-repo.*
