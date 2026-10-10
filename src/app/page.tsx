import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-16 text-zinc-900">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Cloud Agent · Origin
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Ny applikation
          </h1>
          <p className="text-lg text-zinc-600">
            Helt nyt projekt med samme Cloud Agent-opsætning som jeres andre
            apps: Next.js, `.cursor/environment.json`, dev-server på port 4319,
            og klar til Create repo og Publish.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Klar til at bygge videre</CardTitle>
            <CardDescription>
              Ingen kode eller data er hentet fra Stardesk eller andre
              eksisterende apps — kun den fælles udviklingsopsætning.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <a
              href="https://cursor.com/docs/cloud-agent"
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants())}
            >
              Cloud Agent docs
            </a>
            <Link href="/api/health" className={cn(buttonVariants({ variant: "outline" }))}>
              API health
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
