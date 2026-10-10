# UI-SPEC.md — STAR Hub, screens and interaction

Converted from the interactive design prototypes (web + mobile). This file is the visual
reference for `apps/web`. Where it disagrees with `PLAN.md`, `PLAN.md` wins on rules;
this file wins on layout, copy and look.

All UI copy below is final Danish text — use it verbatim.

---

## 1. Design tokens

```css
:root {
  /* brand */
  --star-blue: #003087;        /* header, primary buttons, active nav, today marker */
  --star-red: #C8102E;         /* accent bar in logo, sick, badges */
  --star-turquoise: #00C7B1;   /* day off accent, avatar of current user */
  --blue-tint: #E6EBF4;        /* login background, active nav item, avatars */
  --grey-tint: #F0EEEB;        /* info boxes, "Senere" tags */

  /* neutrals */
  --ink: #1A1F2B;              /* body text */
  --muted: #595959;            /* secondary text */
  --page: #F4F5F8;             /* app background */
  --surface: #FFFFFF;          /* cards */
  --border: #E1E5EE;           /* card borders */
  --border-strong: #C9D0DD;    /* secondary buttons, inputs */
  --input-border: #B9C2D3;
  --row-divider: #EEF0F4;

  /* absence types: bg / fg */
  --sick-bg: #FBE3E7;     --sick-fg: #9B0C24;
  --dayoff-bg: #D3F4EF;   --dayoff-fg: #00574D;
  --vacation-bg: #DCE4F3; --vacation-fg: #003087;
  --absent-bg: #ECEAE6;   --absent-fg: #4A4A4A;   /* masked sick, shown to colleagues */

  /* status: bg / fg */
  --pending-bg: #FFF1D6;  --pending-fg: #7A4B00;
  --approved-bg: #EEF7EE; --approved-fg: #22622A;
  --rejected-bg: #FBE3E7; --rejected-fg: #9B0C24;

  /* staffing row */
  --staff-ok-bg: #EEF7EE;   --staff-ok-fg: #22622A;    /* > 2/3 present */
  --staff-warn-bg: #FFF1D6; --staff-warn-fg: #7A4B00;  /* ≤ 2/3 present */
  --staff-low-bg: #FBE3E7;  --staff-low-fg: #9B0C24;   /* ≤ 1/2 present */

  --focus: #00C7B1;            /* 3px outline, 2px offset */
  --radius-card: 12px;
  --radius-control: 8px;
}
```

- Font: IBM Plex Sans 400/500/600/700, **self-hosted** (no Google Fonts at runtime). Base 15px, line-height 1.45.
- Headings: page h1 28px/600; card h2 18px/600; dialog h2 22px/600.
- Chips: height 26px, radius 13px, 13px/600, bg/fg pairs above.
- Buttons: primary = blue bg, white text, 600; secondary = white bg, `--border-strong` border. Min height 44px (40px allowed inside dense lists).
- Touch targets ≥ 44px. Visible focus ring everywhere. Animations only under `prefers-reduced-motion: no-preference`.
- Icons: inline stroke SVG (chevrons, check). No emoji.

Logo lockup (header and login): 5–6px wide red vertical bar (radius 2px), then "STAR" (700, letter-spacing .04em), then "Hub" (500, 85% opacity on blue / `--muted` on white).

---

## 2. App shell

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ▌STAR Hub                      Demo – vis som [Medarb.|Leder|Admin]  (JV) [Log ud] │  ← header, --star-blue
├────────────┬─────────────────────────────────────────────────────────────┤
│ FRAVÆR     │                                                             │
│ Overblik   │   main content (padding 28px 32px 48px, gap 24px)          │
│ Teamkalender                                                             │
│ Godkendelser (3)  ← leaders only, red badge with count                   │
│ ADMINISTRATION  ← admins only                                            │
│ Medarbejdere og roller                                                   │
│ KOMMUNIKATION                                                            │
│ # Kanaler        [Senere]  (disabled)                                    │
│ Direkte beskeder [Senere]  (disabled)                                    │
└────────────┴─────────────────────────────────────────────────────────────┘
```

- The role switcher in the header is **prototype-only**. In the real app, roles come from Keycloak; show menu items per role.
- Nav: white column 200–240px, section labels 12px/600 uppercase `--muted`; active item = `--blue-tint` bg, blue text, 600.
- Layout is a wrapping flex row: on phone width the nav stacks above content (no sticky, no 100vh).
- Avatar: 36px circle, turquoise bg, initials.

---

## 3. Screens

### 3.1 Login (`/login`)
Centered card (max 400px) on `--blue-tint` background.
- Logo lockup.
- h1 **Log ind**
- Text: **Brug din STAR-konto. Login håndteres af STAR SSO (Keycloak) med tofaktor.**
- Button (full width, primary): **Log ind med STAR-konto** → redirect to Keycloak (the real app has no username/password fields of its own).
- Small text: **Data opbevares i Danmark/EU.**
- Emergency line (muted, 13px): **Kan du ikke logge ind? Ring eller sms til din leder.**

### 3.2 Overblik (`/overblik`)
1. h1 **God morgen, {fornavn}** (God formiddag 10–12, God eftermiddag 12–18, God aften after 18). Sub: **{Ugedag d. måned år} · {n} af {N} til stede i dag**.
2. Leader banner (only if pending > 0): bg `#FFF6E2`, border `#F0D9A6`. Title **{n} anmodninger venter på dig** (1 → **1 anmodning venter på dig**). Text **Fri og ferie kræver din godkendelse. Sygdom registreres direkte.** Button **Gå til godkendelser**.
3. Three action cards (grid, auto-fit min 200px), white, 4px coloured top border:
   | Card | Top border | Title | Sub |
   |---|---|---|---|
   | Sick | red | **Meld syg** | **Gælder straks – ingen godkendelse** |
   | Day off | turquoise | **Anmod om fri** | **En dag eller en periode – leder godkender** |
   | Vacation | blue | **Ferieønske** | **Send eller ret ønske – leder godkender** |
4. Card grid (auto-fit min 300px):
   - **Holdet i dag** (right: team name). Row per person: 32px avatar, name ("(dig)" after own name), chip: **Til stede** (approved colours) / **Syg** / **Fraværende** / **Fri** / **Ferie**. Employees see under the list: **Sygdom vises kun som "Fraværende" for kolleger. Din leder ser kategorien.**
   - **Mine anmodninger og fravær**: rows with type chip, date text, status line, action buttons:
     | Situation | Status line (colour) | Buttons |
     |---|---|---|
     | Active sick | **Aktiv nu** (muted) | **Meld rask** (primary) |
     | Pending | **Afventer godkendelse · sendt {dato}** (pending-fg) | **Ret**, **Træk tilbage** (red text) |
     | Approved, future | **Godkendt** (approved-fg) | **Ret**, **Annullér** (red text) |
     | Rejected | **Afvist af leder – ret og send igen** + reason in a grey box below | **Ret og send igen**, **Træk tilbage** |
     Empty: **Ingen kommende registreringer.**
   - **Min ferie {år}** (phase 3): right **{x} af {y} dage tilbage**; 14px stacked bar (afholdt = blue, godkendt = `#7F98C9`, afventer = striped pending); three numbers **Afholdt / Godkendt, kommende / Afventer**. Footer: **Saldoen kommer fra Statens HR.**

Date text formats: `fre 16. okt · halv dag`, `man 26. okt – fre 30. okt · 5 arbejdsdage`, open sick: `Fra man 12. okt · indtil raskmelding`.

### 3.3 Dialog: Meld syg / Anmod om fri / Ferieønske
Modal, max 480px, overlay `rgba(10,20,45,.45)`. Title per type: **Meld syg**, **Anmod om fri**, **Ferieønske**; when editing **Ret anmodning**.
- Type selector: three equal buttons **Syg | Fri | Ferie**; selected = type bg/fg + 2px border in type accent; `aria-pressed`.
- Sick: one date field **Syg fra** (default today). Grey info box: **Gælder straks. Du skal ikke oplyse årsag.** / **Sygemeldingen løber, til du melder dig rask. Kun din leder ser, at du er syg – kolleger ser "Fraværende".** No other fields. **Never a text field here.**
- Day off / vacation: **Fra** and **Til og med** dates. Below: **{n} arbejdsdage (weekender og helligdage tælles ikke med)**. Day off only: checkbox **Kun halv dag** (only valid when from = to). Blue info box: **Sendes til din leder til godkendelse. Du får besked, når den er behandlet, og kan rette den indtil da.** If colleagues are away: bold pending-fg line **Allerede væk i perioden: {navn (fri)}, {navn (ferie)}.**
- Errors (role="alert", sick-fg): **Vælg en startdato.** · **Slutdato skal være samme dag eller senere.** · **Perioden indeholder ingen arbejdsdage.**
- Buttons: **Annullér** (secondary) · primary **Meld syg** / **Send til godkendelse** / **Send ændring**.
- Toasts after submit: **Du er meldt syg. Din leder er orienteret.** · **Anmodningen er sendt til din leder.** · **Ændringen er sendt til din leder til godkendelse.** · **Du er raskmeldt fra i morgen. God bedring.** · **Anmodning trukket tilbage.**

Toast: dark `#1A1F2B`, white text, bottom centre, role="status", 3.8s.

### 3.4 Teamkalender (`/kalender`)
Header: h1 **Teamkalender**, sub **{periode} · {team}**; buttons **Anmod om fri** (secondary), **Ferieønske** (primary).
Toolbar: segmented **Uge | Måned | År** (selected = blue bg, white); **‹** **I dag** **›** (44px); team picker (phase 2); legend at right.
Legend: type swatches with short codes **Syg (S)** (leaders) or **Fraværende (–)** (employees), **Fri (F)**, **Ferie (Fe)**, **Afventer (?)** (dashed outline), **Weekend/helligdag** (diagonal stripes `#F2F2F2/#E8E8E8`).

Period labels: `Uge 42 · man 12. okt – fre 16. okt 2026` · `Oktober 2026` · `År 2026`.

- **Week**: name column 200px + 5 equal day columns (header `Man 12/10`, today = blue text + 3px blue underline). Cells 40px high, radius 6px: empty = dashed border; absence = type bg/fg with full label (**Syg**, **Fri ½**, **Ferie**); pending = white bg, 2px dashed border in type fg, label with "?"; holiday = grey with holiday name. Bottom row **Til stede**: chip **{n} af {N}** in staffing colours.
- **Month**: name column 180px + 32px per day; header shows weekday letter (M T O T F L S) over day number; today header = blue bg white text; weekend/holiday = striped, no absence shown. Cells 30px with short code (S, F, Fe, –, "F?" for pending). Bottom row **Til stede**: number per working day in staffing colours. Tooltip (title) on each cell: `{navn} · {dato}: {type}`.
- **Year**: name column 180px + 12 month columns (`jan … dec`, current month underlined). Each cell is a button (52px) showing total absence working days (bold) and breakdown (`Fe 10 F 1`); colour by dominant type; ≥ 10 days = solid type colour with white text; none = `·` in light grey; only pending = dashed pending outline with `{n}?`. Click → month view for that month. Bottom row **Laveste bemanding**: `{min}/{N}` per month, staffing colours, tooltip with the date of the minimum.
- Footer note (muted 13px), leader: **Som leder ser du fraværstype og ventende anmodninger (stiplet). Bundrækken viser bemanding – rød er halvdelen eller færre.** Employee: **Kolleger ser sygdom som "Fraværende" og kun godkendt fri og ferie. Dine egne ventende anmodninger vises stiplet.**

Wide grids live in a horizontal scroll box; the page itself never scrolls sideways.

### 3.5 Godkendelser (`/godkendelser`, approvers)
h1 **Godkendelser**, sub **Anmodninger om fri og ferie fra dit team**.
Card per pending request: 40px avatar · name (600) + type chip · date text · muted **Sendt {dato}** (+ **· ændret af medarbejder**) · overlap line in staffing colour: **Samtidig væk: {navn (ferie)}, … Laveste bemanding hvis godkendt: {n} af {N}.** or **Ingen andre væk i perioden. …**
Buttons: **Se i kalender** (secondary → month view at request start), **Afvis** (secondary, red text), **Godkend** (primary).

Reject dialog: title **Afvis anmodning**; required textarea **Begrundelse** (5–500 chars) with hint **Medarbejderen ser begrundelsen. Skriv ikke helbredsoplysninger.**; buttons **Annullér** / **Afvis** (red). Error: **Skriv en kort begrundelse.**

Section **Behandlet i dag**: row `{navn} · {type} · {datoer}` + status chip + **Fortryd** (within 10 min). Empty state: **Ingen anmodninger venter.**
Toasts: **{Navn} har fået besked: ferie godkendt.** / **… afvist.**

### 3.6 Medarbejdere og roller (`/admin/brugere`, admins)
h1 **Medarbejdere og roller**, sub `{n} aktive · {n} ledere · {n} administratorer · {n} deaktiverede`; primary **Tilføj medarbejder**.
Toolbar: search field label **Søg**, placeholder **Navn, brugernavn eller team**; segmented **Aktive | Deaktiverede | Alle**.
List rows (wrap on narrow screens): avatar · name + `brugernavn@star.dk` · team + **Godkender: {navn}** · role chips (**Medarbejder** `#EEF0F4/#3A3F4A`, **Leder** blue tint, **Administrator** `#F1E4F5/#6A1B7A`) · status chip **Aktiv**/**Deaktiveret** + **Sidst logget ind: {tid}** · **Rediger**. Deactivated rows have `#FAFAF8` background.

Edit dialog (max 580px, scrolls): title **Tilføj medarbejder** / **Rediger {navn}**
- **Navn**, **Brugernavn** (placeholder `fornavn.efternavn`)
- **Team**: segmented buttons per team
- **Godkender af fri og ferie**: buttons per active leader + **Ingen**
- **Roller**: checkboxes with descriptions:
  - **Medarbejder** – Melder syg, anmoder om fri og ferie, ser teamkalenderen.
  - **Leder** – Godkender fri og ferie og ser fraværstype for sine medarbejdere.
  - **Administrator** – Opretter brugere, tildeler roller og nulstiller login. Ser ikke sygdom.
- Checkbox **Aktiv konto** – *deaktiverede kan ikke logge ind og vises ikke i kalenderen. Historik bevares.*
- Existing user, grey box **Login og sikkerhed**: **Administratorer ser og sætter aldrig adgangskoder. Brugeren får et link fra STAR SSO og vælger selv en ny.** Buttons **Send link til ny adgangskode**, **Nulstil tofaktor**, **Log ud på alle enheder** (red text).
- New user, blue box: **Kontoen oprettes i STAR SSO. Medarbejderen får en velkomstmail med link til at vælge adgangskode og sætte tofaktor op.**
- Errors: **Udfyld navn og brugernavn.** · **Brugernavn må kun indeholde små bogstaver, tal, punktum og bindestreg.** · **Brugernavnet er allerede i brug.** · **Vælg mindst én rolle.** · **Der skal være mindst én aktiv administrator.**
- Buttons **Annullér** / **Opret og send velkomstmail** or **Gem**.
- Toasts: **{Navn} er oprettet. Velkomstmail med login-link er sendt.** · **Link til ny adgangskode er sendt til {email} (gyldigt 24 timer).** · **Tofaktor nulstillet. {Navn} sætter det op igen ved næste login.** · **{Navn} er logget ud på alle enheder.**

Section **Ændringslog** under the list: rows `{tid}` (130px, muted) + sentence, e.g. *Jan Vinding ændrede Mette Holm: roller → Medarbejder, Leder.*
Footer note: **Roller og konti ligger i STAR SSO (Keycloak). Appen viser og ændrer dem via Keycloaks admin-API, så der kun er ét sted at styre adgang. Administrator-rollen giver ikke adgang til at se sygdom.**

### 3.7 Mobile (390px) — sick in two taps
- Header: blue, logo lockup, avatar.
- h1 **God morgen, {fornavn}**, sub **{Ugedag d. måned} · {n} af {N} til stede**.
- Big red button (min 120px high, radius 16px, white text): **Jeg er syg i dag** / *Ingen årsag – kun din leder får besked*.
- Two cards: **Fri i dag** (*Sendes til godkendelse*), **Ferie** (*Vælg datoer*).
- Card **Kommende** with chips and status (e.g. *Afventer* in pending-fg).
- Confirm screen: h1 **Meld syg fra i dag?** body *Du skal ikke skrive hvorfor. Din leder får besked. Kolleger ser blot, at du er fraværende. Sygemeldingen løber, til du melder dig rask.* Buttons **Ja, meld mig syg** (red, 56px) and **Tilbage**.
  Fri: **Anmod om fri i dag?** / *Din anmodning om fri {dato} sendes til din leder. Du får besked, når den er godkendt.* / **Send anmodning** (dark turquoise `#00574D`).
- Done screen: green check circle, **Du er meldt syg** / *God bedring. Når du er klar, trykker du "Meld rask" på forsiden.* (fri: **Anmodning sendt** / *Den afventer din leders godkendelse. Du kan rette eller trække den tilbage, indtil den er behandlet.*) Buttons **Færdig**, **Fortryd**.

---

## 4. Demo data for dev seed (fictional)

Team **IT Operations**: Jan Vinding (leder, admin), Lars Bech, Ahmed Nasser, Sofie Lund, Ida Krogh, Mette Holm.
Team **AI Platform**: Nanna Friis (leder), Tobias Ravn. **Digitalisering**: Henrik Due (deaktiveret).
Seed July with overlapping vacations so the staffing row shows red in month and year views.
