import { Link, createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_layout/sales/")({
  component: SalesPage,
});

function SalesPage() {
  return (
    <main className="container mx-auto max-w-4xl p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ventas</h1>
          <p className="text-sm text-muted-foreground">
            Administra clientes, sucursales y etiquetas de órdenes de venta.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <Button render={<Link to="/sales/tags" />} size="sm">
          Administrar Etiquetas
        </Button>
      </div>
    </main>
  );
}
