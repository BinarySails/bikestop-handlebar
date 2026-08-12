import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, MoreVertical, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUpdateVariantRequest } from "@/lib/api/api";
import type { Variant } from "@/lib/api/schemas";

const PAGE_SIZE = 10;

type ListStatusFilter = "all" | "enable" | "disable";

const statusBadgeVariant: Record<
  Variant["status"],
  "default" | "secondary" | "destructive"
> = {
  enable: "default",
  disable: "secondary",
  archive: "destructive",
};

const statusLabel: Record<Variant["status"], string> = {
  enable: "Activo",
  disable: "Inactivo",
  archive: "Archivado",
};

const statusFilterLabel: Record<ListStatusFilter, string> = {
  all: "Todos",
  enable: "Activo",
  disable: "Inactivo",
};

function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatProperties(properties: Variant["properties"]): string {
  if (properties.length === 0) return "—";
  return properties
    .filter((property) => property.status !== "archive")
    .map(
      (property) =>
        `${capitalizeFirst(property.property_name)}: ${capitalizeFirst(property.property_value)}`
    )
    .join(", ");
}

function formatRegularPrice(prices: Variant["prices"]): string {
  const regular = prices.find(
    (price) => price.price_type === "regular" && price.status === "enable"
  );
  if (!regular) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: regular.currency,
  }).format(regular.amount / 100);
}

function ViewVariantMenuItem({
  productId,
  variantId,
}: {
  productId: string;
  variantId: string;
}) {
  const navigate = useNavigate();

  return (
    <DropdownMenuItem
      onClick={() =>
        navigate({
          to: "/products/$productId/variants/$variantId",
          params: { productId, variantId },
        })
      }
    >
      Ver
    </DropdownMenuItem>
  );
}

function ArchiveVariantMenuItem({
  productId,
  variant,
  onSuccess,
}: {
  productId: string;
  variant: Variant;
  onSuccess?: () => Promise<unknown>;
}) {
  const { trigger: updateVariant } = useUpdateVariantRequest(
    productId,
    variant.id
  );
  const [pending, setPending] = useState(false);

  async function handleArchive() {
    setPending(true);
    try {
      const result = await updateVariant({
        sku: variant.sku,
        display_name: variant.display_name,
        image_url: variant.image_url,
        status: "archive",
        properties: variant.properties.map((property) => ({
          property_name: property.property_name,
          property_value: property.property_value,
          status: property.status,
        })),
        prices: variant.prices.map((price) => ({
          price_type: price.price_type,
          amount: price.amount,
          currency: price.currency,
          status: price.status,
        })),
      });

      if (result.status === 200) {
        toast.success(`Variante "${variant.display_name}" archivada.`);
        await onSuccess?.();
      } else {
        toast.error("No se pudo archivar la variante.");
      }
    } catch {
      toast.error("No se pudo archivar la variante.");
    } finally {
      setPending(false);
    }
  }

  return (
    <DropdownMenuItem
      variant="destructive"
      onClick={handleArchive}
      disabled={pending || variant.status === "archive"}
    >
      <span>Eliminar</span>
    </DropdownMenuItem>
  );
}

function VariantsListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

type ProductVariantsSectionProps = {
  productId: string;
  variants: Variant[];
  isLoading: boolean;
  error: unknown;
  onSuccess?: () => Promise<unknown>;
};

export function ProductVariantsSection({
  productId,
  variants: allVariants,
  isLoading,
  error,
  onSuccess,
}: ProductVariantsSectionProps) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState<ListStatusFilter>("all");

  const term = appliedSearch.trim().toLowerCase();
  const filteredVariants = allVariants.filter((variant) => {
    if (status !== "all" && variant.status !== status) return false;
    if (!term) return true;
    const searchable = [
      variant.display_name,
      variant.sku,
      formatProperties(variant.properties),
    ]
      .join(" ")
      .toLowerCase();
    return searchable.includes(term);
  });

  const total = filteredVariants.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const pageVariants = filteredVariants.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  function handleApplySearch() {
    setAppliedSearch(search);
    setPage(0);
  }

  function handleClearFilters() {
    setSearch("");
    setAppliedSearch("");
    setStatus("all");
    setPage(0);
  }

  return (
    <section
      aria-label="Variantes del producto"
      className="flex w-full flex-col gap-6"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="search">Búsqueda</Label>
            <div className="relative">
              <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nombre, SKU o propiedad"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleApplySearch();
                  }
                }}
                className="w-72 pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status">Estatus</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as ListStatusFilter);
                setPage(0);
              }}
            >
              <SelectTrigger id="status" className="w-44">
                <SelectValue
                  placeholder="Seleccionar"
                  render={() => <span>{statusFilterLabel[status]}</span>}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="enable">Activo</SelectItem>
                <SelectItem value="disable">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">&nbsp;</span>
            <Button
              className="h-8"
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4">
          {isLoading ? (
            <VariantsListSkeleton />
          ) : error ? (
            <p className="text-sm text-muted-foreground">
              Error al cargar las variantes.
            </p>
          ) : pageVariants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay variantes que coincidan con los filtros.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Total: 0</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estatus</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Propiedades</TableHead>
                    <TableHead>Precio regular</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageVariants.map((variant) => (
                    <TableRow key={variant.id}>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[variant.status]}>
                          {statusLabel[variant.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {variant.sku}
                      </TableCell>
                      <TableCell>{variant.display_name}</TableCell>
                      <TableCell>
                        {formatProperties(variant.properties)}
                      </TableCell>
                      <TableCell>
                        {formatRegularPrice(variant.prices)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Acciones de ${variant.display_name}`}
                                className="size-8"
                              >
                                <MoreVertical className="size-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <ViewVariantMenuItem
                              productId={productId}
                              variantId={variant.id}
                            />
                            <DropdownMenuSeparator />
                            <ArchiveVariantMenuItem
                              productId={productId}
                              variant={variant}
                              onSuccess={onSuccess}
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Página {page + 1} de {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="size-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={page >= totalPages - 1}
                  >
                    Siguiente
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
