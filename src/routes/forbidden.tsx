import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/forbidden")({
  validateSearch: z.object({
    policy: z.string().optional(),
    from: z.string().optional(),
  }),
  component: ForbiddenPage,
});

function ForbiddenPage() {
  const { policy } = Route.useSearch();

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <ShieldAlert className="size-8" aria-hidden="true" />
      </div>

      <div className="flex max-w-md flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          No tienes permisos para esta sección
        </h1>
        <p className="text-sm text-muted-foreground">
          Tu rol actual no incluye el acceso necesario. Si crees que es un
          error, solicita a un administrador que revise tus permisos.
        </p>
        {policy && (
          <p className="text-xs text-muted-foreground">
            Permiso requerido:{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">
              {policy}
            </code>
          </p>
        )}
      </div>

      <Button
        render={<Link to="/" />}
        className="bg-gray-900 text-white hover:bg-gray-800"
      >
        Volver al inicio
      </Button>
    </main>
  );
}
