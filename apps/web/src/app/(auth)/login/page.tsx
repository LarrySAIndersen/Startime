import Link from "next/link";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{ background: "var(--blue-tint)" }}
    >
      <div
        className="w-full max-w-[400px] rounded-[var(--radius-card)] border p-8 shadow-sm"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="mb-6">
          <Logo />
        </div>
        <h1 className="mb-3 text-[28px] font-semibold leading-tight">Log ind</h1>
        <p className="mb-6 text-[var(--muted)]">
          Brug din STAR-konto. Login håndteres af STAR SSO (Keycloak) med tofaktor.
        </p>
        <Link
          href="/api/auth/login"
          className="motion-safe-transition flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] px-4 text-center text-sm font-semibold text-white"
          style={{ background: "var(--star-blue)" }}
        >
          Log ind med STAR-konto
        </Link>
        <p className="mt-4 text-sm text-[var(--muted)]">Data opbevares i Danmark/EU.</p>
        <p className="mt-6 text-[13px] text-[var(--muted)]">
          Kan du ikke logge ind? Ring eller sms til din leder.
        </p>
      </div>
    </div>
  );
}
