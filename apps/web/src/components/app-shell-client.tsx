"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./app-shell";

export function AppShellClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AppShell activePath={pathname} roles={["employee", "manager", "admin"]}>
      {children}
    </AppShell>
  );
}
