import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreVertical,
  Plus,
  Search,
  Tags,
} from "lucide-react";

import { BrandImage } from "@/components/features/brands/brand-image";
import { BrandStatusBadge } from "@/components/features/brands/brand-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Brand } from "@/lib/api/schemas";

export type BrandsCatalogViewProps = {
  brands: Brand[];
  page: number;
  limit: number;
  total: number;
  search: string;
  archivedOnly: boolean;
  loading?: boolean;
  refreshing?: boolean;
  error?: string | null;
  onSearchChange: (value: string) => void;
  onArchivedOnlyChange: (value: boolean) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onCreate: () => void;
  onView: (brand: Brand) => void;
  onArchive: (brand: Brand) => void;
};

export function getBrandPageCount(total: number, limit: number): number {
  if (limit <= 0) return 1;
  return Math.max(1, Math.ceil(total / limit));
}

function BrandActions({
  brand,
  onView,
  onArchive,
}: Pick<BrandsCatalogViewProps, "onView" | "onArchive"> & {
  brand: Brand;
}) {
  const archived = brand.status === "archive";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Acciones de ${brand.display_name}`}
          />
        }
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(brand)}>
          <Eye /> Ver detalle
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={archived}
          onClick={() => onArchive(brand)}
        >
          <Archive /> {archived ? "Marca archivada" : "Archivar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3" aria-label="Cargando marcas">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function BrandsCatalogView(props: BrandsCatalogViewProps) {
  const {
    brands,
    page,
    limit,
    total,
    search,
    archivedOnly,
    loading,
    refreshing,
    error,
    onSearchChange,
    onArchivedOnlyChange,
    onPageChange,
    onRetry,
    onCreate,
    onView,
    onArchive,
  } = props;
  const pageCount = getBrandPageCount(total, limit);

  return (
    <section
      aria-label="Marcas"
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Marcas</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las marcas de productos disponibles en BikeStop.
          </p>
        </div>
        <Button onClick={onCreate}>
          <Plus /> Crear marca
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Tags className="size-4" /> Catálogo de marcas
          </CardTitle>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                className="pl-9"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                aria-label="Buscar marcas"
                placeholder="Buscar por nombre"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="sm:ml-auto"
              aria-pressed={archivedOnly}
              onClick={() => onArchivedOnlyChange(!archivedOnly)}
            >
              <Archive />
              {archivedOnly ? "Mostrar activas" : "Mostrar archivadas"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState />
          ) : error ? (
            <div role="alert" className="space-y-3 py-10 text-center">
              <p className="font-medium">No se pudieron cargar las marcas.</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={onRetry}>
                Reintentar
              </Button>
            </div>
          ) : brands.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-medium">
                {search
                  ? "No encontramos marcas para esta búsqueda."
                  : "No hay marcas registradas."}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search
                  ? "Prueba con otro nombre."
                  : "Crea la primera marca para comenzar."}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <Table aria-label="Listado de marcas">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Marca</TableHead>
                      <TableHead className="w-12">
                        <span className="sr-only">Acciones</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brands.map((brand) => (
                      <TableRow key={brand.id}>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-4">
                            <BrandImage
                              src={brand.image_url}
                              alt={brand.display_name}
                              className="size-14 rounded-xl bg-background shadow-sm"
                            />
                            <div className="flex min-w-0 items-center gap-3">
                              <p className="truncate text-base font-semibold tracking-tight">
                                {brand.display_name}
                              </p>
                              {archivedOnly && (
                                <BrandStatusBadge status="archive" />
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <BrandActions
                            brand={brand}
                            onView={onView}
                            onArchive={onArchive}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="grid gap-3 md:hidden">
                {brands.map((brand) => (
                  <article
                    key={brand.id}
                    className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <BrandImage
                      src={brand.image_url}
                      alt={brand.display_name}
                      className="size-16 rounded-xl bg-background"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <h3 className="truncate text-base font-semibold tracking-tight">
                          {brand.display_name}
                        </h3>
                        {archivedOnly && <BrandStatusBadge status="archive" />}
                      </div>
                    </div>
                    <BrandActions
                      brand={brand}
                      onView={onView}
                      onArchive={onArchive}
                    />
                  </article>
                ))}
              </div>
              {refreshing && (
                <p
                  className="mt-3 text-xs text-muted-foreground"
                  aria-live="polite"
                >
                  Actualizando marcas…
                </p>
              )}
            </>
          )}

          {!loading && !error && total > 0 && (
            <nav
              aria-label="Paginación de marcas"
              className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm text-muted-foreground">
                Página {page + 1} de {pageCount} · {total} marcas
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 0}
                  onClick={() => onPageChange(page - 1)}
                >
                  <ChevronLeft /> Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pageCount - 1}
                  onClick={() => onPageChange(page + 1)}
                >
                  Siguiente <ChevronRight />
                </Button>
              </div>
            </nav>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
