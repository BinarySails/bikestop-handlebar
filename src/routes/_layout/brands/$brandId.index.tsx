import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil } from "lucide-react";

import { BrandImage } from "@/components/features/brands/brand-image";
import { BrandStatusBadge } from "@/components/features/brands/brand-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetBrandRequest } from "@/lib/api/api";

export const Route = createFileRoute("/_layout/brands/$brandId/")({
  component: BrandDetailPage,
});

const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });

function BrandDetailPage() {
  const { brandId } = Route.useParams();
  const query = useGetBrandRequest(brandId);
  const brand = query.data?.status === 200 ? query.data.data : null;
  const error = query.error || (query.data && query.data.status !== 200);

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" render={<Link to="/brands" />}>
          <ArrowLeft /> Volver a marcas
        </Button>
        {brand && brand.status !== "archive" && (
          <Button
            render={
              <Link to="/brands/$brandId/edit" params={{ brandId: brand.id }} />
            }
          >
            <Pencil /> Editar marca
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de marca</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <div className="space-y-4" aria-label="Cargando detalle de marca">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : error ? (
            <div role="alert" className="space-y-3 py-10 text-center">
              <p>No se pudo cargar el detalle de la marca.</p>
              <Button variant="outline" onClick={() => query.mutate()}>
                Reintentar
              </Button>
            </div>
          ) : brand ? (
            <div className="space-y-8">
              <div className="flex items-center gap-5">
                <BrandImage
                  src={brand.image_url}
                  alt={brand.display_name}
                  className="size-24 rounded-2xl bg-background shadow-sm"
                />
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {brand.display_name}
                  </h1>
                  <BrandStatusBadge status={brand.status} />
                </div>
              </div>
              <dl className="grid gap-5 rounded-xl border p-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Identificador
                  </dt>
                  <dd className="mt-1 font-mono text-xs break-all">
                    {brand.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Fecha de creación
                  </dt>
                  <dd className="mt-1">
                    {dateFormatter.format(new Date(brand.created_at))}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">
                    URL de imagen
                  </dt>
                  <dd className="mt-1 text-sm break-all">{brand.image_url}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
