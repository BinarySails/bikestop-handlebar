import { createFileRoute } from "@tanstack/react-router";
import { PackagePlus } from "lucide-react";

import { CreateBrandDialog } from "@/components/features/products/create-brand-modal";
import { BrandsTable } from "@/components/features/brands/brands-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useListBrandsRequest } from "@/lib/api/api";
import type { Brand } from "@/lib/api/schemas";

export const Route = createFileRoute("/_layout/brands/")({
  component: BrandsListPage,
});

function BrandsListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function BrandsListPage() {
  const { data: res, error, isLoading } = useListBrandsRequest();

  const brands: Brand[] = res?.status === 200 ? res.data : [];

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
          {isLoading ? (
            <BrandsListSkeleton />
          ) : error ? (
            <p className="text-sm text-muted-foreground">
              Error al cargar las marcas.
            </p>
          ) : brands.length === 0 ? (
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
