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
} from "lucide-react";

import { BrandImage } from "@/components/features/brands/brand-image";
import { BrandStatusBadge } from "@/components/features/brands/brand-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  return (
    <section
      aria-label="Marcas"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Marcas</h1>
        </div>
        <Button onClick={onCreate}>
          <Plus /> Crear marca
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="brand-search">Búsqueda</Label>
            <div className="relative">
              <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                id="brand-search"
                aria-label="Buscar marcas"
                placeholder="Buscar por nombre"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className="w-72 pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="brand-order">Orden</Label>
            <select
              id="brand-order"
              aria-label="Ordenar marcas"
              value={order ?? ""}
              onChange={(event) =>
                onOrderChange((event.target.value || undefined) as BrandOrder)
              }
              className="h-9 w-44 rounded-lg border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Orden por nombre</option>
              <option value="asc">Más antiguas primero</option>
              <option value="desc">Más recientes primero</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="brand-limit">Resultados</Label>
            <select
              id="brand-limit"
              aria-label="Resultados por página"
              value={limit}
              onChange={(event) => onLimitChange(Number(event.target.value))}
              className="h-9 w-36 rounded-lg border border-input bg-transparent px-3 text-sm"
            >
              {[10, 20, 50].map((value) => (
                <option key={value} value={value}>
                  {value} por página
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">&nbsp;</span>
            <Button
              className="h-8"
              variant="outline"
              size="sm"
              onClick={onClearFilters}
            >
              <RotateCcw /> Limpiar
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4">
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
              <Table aria-label="Listado de marcas">
                <TableHeader>
                  <TableRow>
                    <TableHead>Estatus</TableHead>
                    <TableHead>Marca</TableHead>
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
                        <BrandStatusBadge status={brand.status} />
                      </TableCell>
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

              {total > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Página {page + 1} de {pageCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 0}
                      onClick={() => onPageChange(page - 1)}
                    >
                      <ChevronLeft className="size-4" /> Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pageCount - 1}
                      onClick={() => onPageChange(page + 1)}
                    >
                      Siguiente <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
