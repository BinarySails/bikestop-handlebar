import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Power,
  RotateCcw,
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

export type BrandOrder = "asc" | "desc" | undefined;

export type BrandsCatalogViewProps = {
  brands: Brand[];
  page: number;
  limit: number;
  total: number;
  search: string;
  order: BrandOrder;
  loading?: boolean;
  refreshing?: boolean;
  error?: string | null;
  onSearchChange: (value: string) => void;
  onOrderChange: (value: BrandOrder) => void;
  onLimitChange: (value: number) => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
  onRetry: () => void;
  onCreate: () => void;
  onView: (brand: Brand) => void;
  onEdit: (brand: Brand) => void;
  onToggle: (brand: Brand) => void;
  onArchive: (brand: Brand) => void;
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });

export function getBrandPageCount(total: number, limit: number): number {
  if (limit <= 0) return 1;
  return Math.max(1, Math.ceil(total / limit));
}

function BrandActions({
  brand,
  onView,
  onEdit,
  onToggle,
  onArchive,
}: Pick<
  BrandsCatalogViewProps,
  "onView" | "onEdit" | "onToggle" | "onArchive"
> & { brand: Brand }) {
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
        <DropdownMenuItem disabled={archived} onClick={() => onEdit(brand)}>
          <Pencil /> Editar
        </DropdownMenuItem>
        <DropdownMenuItem disabled={archived} onClick={() => onToggle(brand)}>
          <Power /> {brand.status === "enable" ? "Desactivar" : "Activar"}
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
    order,
    loading,
    refreshing,
    error,
    onSearchChange,
    onOrderChange,
    onLimitChange,
    onPageChange,
    onClearFilters,
    onRetry,
    onCreate,
    onView,
    onEdit,
    onToggle,
    onArchive,
  } = props;
  const pageCount = getBrandPageCount(total, limit);
  const hasFilters = Boolean(search || order);

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
          <div className="grid gap-3 md:grid-cols-[minmax(12rem,1fr)_auto_auto_auto]">
            <div className="relative">
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
            <select
              aria-label="Ordenar marcas"
              value={order ?? ""}
              onChange={(event) =>
                onOrderChange((event.target.value || undefined) as BrandOrder)
              }
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Orden por nombre</option>
              <option value="asc">Más antiguas primero</option>
              <option value="desc">Más recientes primero</option>
            </select>
            <select
              aria-label="Resultados por página"
              value={limit}
              onChange={(event) => onLimitChange(Number(event.target.value))}
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            >
              {[10, 20, 50].map((value) => (
                <option key={value} value={value}>
                  {value} por página
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              disabled={!hasFilters}
              onClick={onClearFilters}
            >
              <RotateCcw /> Limpiar
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
                  ? "Prueba con otro nombre o limpia los filtros."
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
                      <TableHead>Estado</TableHead>
                      <TableHead>Creación</TableHead>
                      <TableHead className="w-12">
                        <span className="sr-only">Acciones</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brands.map((brand) => (
                      <TableRow key={brand.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <BrandImage
                              src={brand.image_url}
                              alt={brand.display_name}
                            />
                            <span className="font-medium">
                              {brand.display_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <BrandStatusBadge status={brand.status} />
                        </TableCell>
                        <TableCell>
                          {dateFormatter.format(new Date(brand.created_at))}
                        </TableCell>
                        <TableCell>
                          <BrandActions
                            brand={brand}
                            onView={onView}
                            onEdit={onEdit}
                            onToggle={onToggle}
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
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <BrandImage
                      src={brand.image_url}
                      alt={brand.display_name}
                      className="size-12"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium">
                        {brand.display_name}
                      </h3>
                      <div className="mt-1">
                        <BrandStatusBadge status={brand.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Creada{" "}
                        {dateFormatter.format(new Date(brand.created_at))}
                      </p>
                    </div>
                    <BrandActions
                      brand={brand}
                      onView={onView}
                      onEdit={onEdit}
                      onToggle={onToggle}
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
