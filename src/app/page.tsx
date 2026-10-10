import { Button } from "@/components/ui/button";
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
            Projektet kører med samme Cloud Agent-opsætning som jeres andre
            apps: Next.js, `.cursor/environment.json`, dev-server på port 4319,
            og klar til Create repo + Publish.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>
              Workspace er initialiseret. Reference-sync fra Stardesk kører
              automatisk når agent-token har adgang til Origin-repoet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <a href="https://cursor.com/docs/cloud-agent" target="_blank" rel="noreferrer">
                Cloud Agent docs
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/api/health">API health</a>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
