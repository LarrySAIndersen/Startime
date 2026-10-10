# Demo af alle STAR Hub-funktioner (lokal VM / Cursor)

Repo: [github.com/LarrySAIndersen/Startime](https://github.com/LarrySAIndersen/Startime)

## Kom i gang

```bash
git clone https://github.com/LarrySAIndersen/Startime.git
cd Startime
bash scripts/deploy-local-vm.sh
```

Åbn **http://127.0.0.1:5080/login** (én port: React + API).

Udvikling med hot reload:

```bash
bash scripts/run-local-vm.sh
# Web http://127.0.0.1:4319  ·  API http://127.0.0.1:5080
```

Nulstil demo-data:

```bash
rm -f .local/starhub.db
bash scripts/deploy-local-vm.sh
```

## Demo-brugere (fiktive)

| Bruger | Login-knap | Roller |
|--------|------------|--------|
| Jan Vinding | `leder1` | Medarbejder, leder, **admin** |
| Lars Bech | `medarbejder1` | Medarbejder |
| Ahmed, Sofie, Ida, Mette | øvrige | Medarbejdere (samme team) |

Team: **IT Operations**. Leder: Jan.

---

## Scenarie 1 — Ferieønske og godkendelse

1. Log ind som **Lars Bech**.
2. **Overblik** → **Ferieønske** → vælg datoer → **Send til godkendelse**.
3. **Log ud** → log ind som **Jan Vinding**.
4. Tjek banner / **Godkendelser** → **Godkend** (eller **Afvis** med begrundelse min. 5 tegn).
5. Log ind som Lars igen → se status under **Mine anmodninger**.

## Scenarie 2 — Sygdom og raskmelding

1. Som **Lars** → **Meld syg** (ingen årsagsfelt).
2. Som **Ahmed** (kollega) → **Teamkalender**: Lars vises maskeret (fraværende/–), ikke “syg”.
3. Som **Jan** → kalender kan vise syg for Lars.
4. Som **Lars** → **Meld rask**.

## Scenarie 3 — Fri (halv dag)

1. Som **Sofie** → **Anmod om fri** → samme dag → **Kun halv dag** → send.
2. Som **Jan** → godkend i **Godkendelser**.

## Scenarie 4 — Træk tilbage

1. Som medarbejder med **afventende** anmodning → **Træk tilbage**.

## Scenarie 5 — Stedfortræder

1. Som **Jan** → **Stedfortræder** → vælg medarbejder + fra-dato → **Gem**.

## Scenarie 6 — Administration (kun Jan)

1. **Medarbejdere og roller** — liste over aktive.
2. **Helligdage** — seeded 2026 (fx 24/12, 31/12, grundlovsdag).
3. **Ændringslog** — audit fra demo-handlinger.

## Scenarie 7 — Min log

1. Som enhver bruger → **Min log** — egne audit-/adgangsposter (hvor genereret).

---

## Cursor Cloud Agent

På agent-VM: **Preview / Desktop** → `http://127.0.0.1:5080/login`.

`127.0.0.1` i din **lokale PC-browser** peger på din egen maskine — brug Preview eller kør
`deploy-local-vm.sh` lokalt efter clone.

---

## Hvad demo ikke viser endnu

Keycloak, PostgreSQL, rigtig e-mail, retention-job, HR-saldo og fuld måned/år-kalender — se
[`PRINCIPPER-OG-DATABESKYTTELSE.md`](./PRINCIPPER-OG-DATABESKYTTELSE.md) §10.
