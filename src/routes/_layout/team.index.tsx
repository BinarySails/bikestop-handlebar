import { Link, createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_layout/team/")({
  component: TeamIndexPage,
});

function TeamIndexPage() {
  return (
    <main className="container mx-auto max-w-4xl p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Equipo</h1>
          <p className="text-sm text-muted-foreground">
            Administra los roles y permisos del sistema.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <Button render={<Link to="/team/roles" />} size="sm">
          Administrar Roles
        </Button>
      </div>
    </main>
  );
}
