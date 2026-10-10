import Link from "next/link";
import { Logo } from "./logo";

type NavItem = {
  href: string;
  label: string;
  badge?: number;
  roles?: string[];
  section?: string;
};

const nav: NavItem[] = [
  { href: "/overblik", label: "Overblik" },
  { href: "/kalender", label: "Teamkalender" },
  { href: "/godkendelser", label: "Godkendelser", badge: 3, roles: ["manager"] },
  { section: "ADMINISTRATION", href: "/admin/brugere", label: "Medarbejdere og roller", roles: ["admin"] },
];

export function AppShell({
  children,
  activePath,
  roles = ["employee", "manager", "admin"],
}: {
  children: React.ReactNode;
  activePath: string;
  roles?: string[];
}) {
  const show = (item: NavItem) => !item.roles || item.roles.some((r) => roles.includes(r));
  const items = nav.filter(show);

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-white md:px-6"
        style={{ background: "var(--star-blue)" }}
      >
        <Logo onDark />
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline opacity-90">Jan Vinding</span>
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-[var(--ink)]"
            style={{ background: "var(--star-turquoise)" }}
            aria-hidden
          >
            JV
          </span>
          <Link href="/login" className="rounded-lg px-3 py-2 underline-offset-2 hover:underline">
            Log ud
          </Link>
        </div>
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <nav
          className="border-b md:w-56 md:shrink-0 md:border-b-0 md:border-r px-3 py-4"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          aria-label="Hovedmenu"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Fravær
          </p>
          <ul className="space-y-1">
            {items.map((item) => {
              const active = activePath === item.href || activePath.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  {item.section ? (
                    <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {item.section}
                    </p>
                  ) : null}
                  <Link
                    href={item.href}
                    className="motion-safe-transition flex min-h-11 items-center justify-between rounded-lg px-3 py-2 text-sm font-medium"
                    style={
                      active
                        ? {
                            background: "var(--blue-tint)",
                            color: "var(--star-blue)",
                            fontWeight: 600,
                          }
                        : { color: "var(--ink)" }
                    }
                  >
                    {item.label}
                    {item.badge ? (
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                        style={{ background: "var(--star-red)" }}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-7">{children}</main>
      </div>
    </div>
  );
}
