import { createFileRoute } from "@tanstack/react-router";
import { PackagePlus } from "lucide-react";

import { CreateBrandDialog } from "@/components/features/products/create-brand-modal";
import { BrandsTable } from "@/components/features/brands/brands-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Brand } from "@/lib/api/schemas";

export const Route = createFileRoute("/_layout/brands/")({
  component: BrandsListPage,
});

function BrandsListPage() {
  // El backend no expone aún el endpoint de listado de marcas.
  const brands: Brand[] = [];

  return (
    <section
      aria-label="Marcas"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Marcas</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las marcas de productos disponibles en BikeStop.
          </p>
        </div>
        <CreateBrandDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <PackagePlus className="size-4" />
            Marcas registradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {brands.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay marcas registradas.
            </p>
          ) : (
            <BrandsTable brands={brands} />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
