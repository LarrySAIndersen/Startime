import Link from "next/link";
import { demoRequests, demoTeam } from "@/lib/demo-data";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 10) return "God morgen";
  if (h < 12) return "God formiddag";
  if (h < 18) return "God eftermiddag";
  return "God aften";
}

const actionCards = [
  { title: "Meld syg", sub: "Gælder straks – ingen godkendelse", accent: "var(--star-red)" },
  { title: "Anmod om fri", sub: "En dag eller en periode – leder godkender", accent: "var(--star-turquoise)" },
  { title: "Ferieønske", sub: "Send eller ret ønske – leder godkender", accent: "var(--star-blue)" },
];

export default function OverblikPage() {
  const today = new Intl.DateTimeFormat("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header>
        <h1 className="text-[28px] font-semibold">{greeting()}, Jan</h1>
        <p className="text-[var(--muted)]">
          {today} · {demoTeam.present} af {demoTeam.total} til stede i dag
        </p>
      </header>

      <div
        className="rounded-[var(--radius-card)] border px-4 py-4 md:flex md:items-center md:justify-between md:gap-4"
        style={{ background: "#FFF6E2", borderColor: "#F0D9A6" }}
      >
        <div>
          <p className="font-semibold">3 anmodninger venter på dig</p>
          <p className="text-sm text-[var(--muted)]">
            Fri og ferie kræver din godkendelse. Sygdom registreres direkte.
          </p>
        </div>
        <Link
          href="/godkendelser"
          className="motion-safe-transition mt-3 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] px-4 text-sm font-semibold text-white md:mt-0"
          style={{ background: "var(--star-blue)" }}
        >
          Gå til godkendelser
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {actionCards.map((card) => (
          <button
            key={card.title}
            type="button"
            className="motion-safe-transition rounded-[var(--radius-card)] border bg-[var(--surface)] p-4 text-left shadow-sm"
            style={{ borderColor: "var(--border)", borderTopWidth: 4, borderTopColor: card.accent }}
          >
            <p className="text-lg font-semibold">{card.title}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{card.sub}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section
          className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-5"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">Holdet i dag</h2>
            <span className="text-sm text-[var(--muted)]">{demoTeam.name}</span>
          </div>
          <ul className="divide-y" style={{ borderColor: "var(--row-divider, #eef0f4)" }}>
            {demoTeam.members.map((m) => (
              <li key={m.name} className="flex min-h-11 items-center gap-3 py-2">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
                  style={{ background: "var(--blue-tint)", color: "var(--star-blue)" }}
                >
                  {m.initials}
                </span>
                <span className="flex-1 font-medium">
                  {m.name}
                  {m.self ? " (dig)" : ""}
                </span>
                <span className="chip">{m.status}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-[var(--muted)]">
            Sygdom vises kun som &quot;Fraværende&quot; for kolleger. Din leder ser kategorien.
          </p>
        </section>

        <section
          className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-5"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="mb-4 text-lg font-semibold">Mine anmodninger og fravær</h2>
          {demoRequests.map((r) => (
            <div key={r.dates} className="border-t py-3 first:border-t-0 first:pt-0" style={{ borderColor: "var(--border)" }}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip chip-vacation">{r.type}</span>
                <span className="text-sm">{r.dates}</span>
              </div>
              <p className="mt-1 text-sm" style={{ color: "var(--pending-fg)" }}>
                {r.status}
              </p>
              <div className="mt-2 flex gap-2">
                <button type="button" className="btn-secondary min-h-11 px-3 text-sm">
                  Ret
                </button>
                <button type="button" className="min-h-11 px-3 text-sm font-medium text-[var(--star-red)]">
                  Træk tilbage
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>

    </div>
  );
}
