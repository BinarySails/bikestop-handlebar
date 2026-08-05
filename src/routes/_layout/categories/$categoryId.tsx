import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Tags } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CategoryApiError,
  useCategories,
  useCategory,
} from "@/lib/api/categories";

export const Route = createFileRoute("/_layout/categories/$categoryId")({
  component: CategoryDetailPage,
});

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "long",
});

function CategoryDetailPage() {
  const { categoryId } = Route.useParams();
  const detailQuery = useCategory(categoryId);
  const categoriesQuery = useCategories();
  const category = detailQuery.data?.category;
  const parentName = category?.parent_id
    ? (categoriesQuery.data?.categories.find(
        (item) => item.id === category.parent_id
      )?.display_name ?? "Categoría padre no disponible")
    : "Sin categoría padre";

  if (detailQuery.isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </main>
    );
  }

  if (detailQuery.error || !category) {
    const notFound =
      detailQuery.error instanceof CategoryApiError &&
      detailQuery.error.status === 404;

    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">
          {notFound
            ? "Categoría no encontrada"
            : "No se pudo cargar la categoría"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {notFound
            ? "La categoría solicitada ya no existe."
            : "Intenta cargar la información nuevamente."}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link to="/categories" />}>
            Volver a categorías
          </Button>
          {!notFound && (
            <Button onClick={() => detailQuery.mutate()}>Reintentar</Button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            aria-label="Volver a categorías"
            render={<Link to="/categories" />}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {category.display_name}
              </h1>
              <Badge
                variant={category.status === "active" ? "default" : "secondary"}
              >
                {category.status === "active" ? "Activa" : "Inactiva"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Detalle de la categoría
            </p>
          </div>
        </div>
        <Button
          render={
            <Link to="/categories/$categoryId/edit" params={{ categoryId }} />
          }
        >
          <Pencil className="size-4" /> Editar categoría
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Tags className="size-4" /> Información general
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Nombre visible</dt>
              <dd className="mt-1 font-medium">{category.display_name}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Slug</dt>
              <dd className="mt-1 font-mono text-sm">{category.slug}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Categoría padre</dt>
              <dd className="mt-1">{parentName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Fecha de creación
              </dt>
              <dd className="mt-1">
                {dateFormatter.format(new Date(category.created_at))}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">Descripción</dt>
              <dd className="mt-1 whitespace-pre-wrap">
                {category.description || "Sin descripción"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </main>
  );
}
