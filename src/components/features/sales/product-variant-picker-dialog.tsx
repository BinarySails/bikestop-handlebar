import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImageOff, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";

import {
  EntityFilterBar,
  type FilterDefinition,
} from "@/components/features/entity/entity-filter-bar";
import { pickMainImageUrl } from "@/components/features/sales/product-line-thumbnail";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  getProductRequest,
  getVariantRequest,
  useGetCategoriesRequest,
  useListBrandsRequest,
  useListCatalogProductsRequest,
} from "@/lib/api/api";
import type {
  BrandId,
  CategoryId,
  CatalogProduct,
  Product,
  Variant,
  VariantId,
} from "@/lib/api/schemas";
import { centsToPesos } from "@/lib/money";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";

export type ProductVariantSelection = {
  product: Product;
  variant: Variant;
};

function CatalogCard({
  item,
  isExcluded,
  isOutOfStock,
  isAdding,
  onAdd,
}: {
  item: CatalogProduct;
  isExcluded: boolean;
  isOutOfStock: boolean;
  isAdding: boolean;
  onAdd: () => void;
}) {
  const imageUrl = pickMainImageUrl(item.images);
  const price = item.default_price;

  return (
    <button
      type="button"
      disabled={isExcluded || isOutOfStock || isAdding}
      onClick={onAdd}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all",
        !isExcluded &&
          !isOutOfStock &&
          "hover:border-primary/60 hover:shadow-sm",
        (isExcluded || isOutOfStock) && "cursor-not-allowed opacity-60"
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.display_name}
            loading="lazy"
            className="size-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-10" />
          </div>
        )}
        {isAdding && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="size-6 animate-spin text-white" />
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Badge variant="destructive" className="text-xs">
              Sin stock
            </Badge>
          </span>
        )}
        {isExcluded && !isOutOfStock && (
          <span className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs">
              Agregada
            </Badge>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-sm leading-tight font-semibold">
          {item.display_name}
        </span>
        <span className="text-xs text-muted-foreground">
          {item.brand.display_name} · {item.category.display_name}
        </span>
        <span className="text-xs text-muted-foreground">SKU: {item.sku}</span>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <Badge
            variant={item.stock_quantity > 0 ? "secondary" : "destructive"}
          >
            Stock: {item.stock_quantity}
          </Badge>
          {price && (
            <span className="text-sm font-medium">
              ${centsToPesos(price.amount).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function ProductVariantPickerDialog({
  open,
  onOpenChange,
  onPick,
  excludeVariantIds = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (selections: ProductVariantSelection[]) => void;
  excludeVariantIds?: string[];
}) {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<
    Partial<Record<string, string>>
  >({});
  const [addingId, setAddingId] = useState<VariantId | null>(null);

  const debouncedSearch = useDebouncedValue(search.trim());
  const abortControllerRef = useRef<AbortController | null>(null);

  const excluded = useMemo(
    () => new Set(excludeVariantIds),
    [excludeVariantIds]
  );

  const { data: brandsRes } = useListBrandsRequest(undefined, {
    swr: { enabled: open },
  });
  const brandOptions = useMemo(
    () =>
      brandsRes?.status === 200
        ? brandsRes.data.data.map((b) => ({
            value: b.id as BrandId,
            label: b.display_name,
          }))
        : [],
    [brandsRes]
  );

  const { data: categoriesRes } = useGetCategoriesRequest(undefined, {
    swr: { enabled: open },
  });
  const categoryOptions = useMemo(
    () =>
      categoriesRes?.status === 200
        ? categoriesRes.data.categories.map((c) => ({
            value: c.id as CategoryId,
            label: c.display_name,
          }))
        : [],
    [categoriesRes]
  );

  const filterDefinitions = useMemo<FilterDefinition[]>(
    () => [
      ...(brandOptions.length > 0
        ? [
            {
              key: "brand",
              label: "Marca",
              type: "combobox" as const,
              options: brandOptions,
            } as const,
          ]
        : []),
      ...(categoryOptions.length > 0
        ? [
            {
              key: "category",
              label: "Categoría",
              type: "combobox" as const,
              options: categoryOptions,
            } as const,
          ]
        : []),
    ],
    [brandOptions, categoryOptions]
  );

  const catalogParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      brand_id:
        filterValues.brand && filterValues.brand !== ""
          ? (filterValues.brand as BrandId)
          : undefined,
      category_id:
        filterValues.category && filterValues.category !== ""
          ? (filterValues.category as CategoryId)
          : undefined,
      limit: 60,
    }),
    [debouncedSearch, filterValues]
  );

  const { data: catalogRes, isLoading: isLoadingCatalog } =
    useListCatalogProductsRequest(catalogParams, {
      swr: { enabled: open, keepPreviousData: true },
    });
  const catalogItems = useMemo<CatalogProduct[]>(
    () => (catalogRes?.status === 200 ? catalogRes.data.data : []),
    [catalogRes]
  );
  const totalCount = catalogRes?.status === 200 ? catalogRes.data.total : 0;
  const hasMore = totalCount > catalogItems.length;

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setFilterValues({});
    setAddingId(null);
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
  }, [open]);

  const handleInstantAdd = useCallback(
    async (item: CatalogProduct) => {
      if (excluded.has(item.id)) {
        toast.info("Esta variante ya está en la orden.");
        return;
      }
      setAddingId(item.id);
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      try {
        const [variantRes, productRes] = await Promise.all([
          getVariantRequest(item.product_id, item.id, {
            signal: abortControllerRef.current.signal,
          }),
          getProductRequest(item.product_id, {
            signal: abortControllerRef.current.signal,
          }),
        ]);
        if (variantRes.status !== 200 || productRes.status !== 200) return;
        onPick([
          {
            product: productRes.data as Product,
            variant: variantRes.data as Variant,
          },
        ]);
      } finally {
        setAddingId(null);
      }
    },
    [excluded, onPick]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] sm:max-w-4xl lg:max-w-5xl [&>div]:contents">
        <DialogHeader>
          <DialogTitle>Agregar productos</DialogTitle>
          <DialogDescription>
            Busca y filtra variantes para agregarlas a la orden. Haz clic en una
            tarjeta para agregarla.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, SKU..."
              className="pr-9 pl-9"
              aria-label="Buscar variante"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {filterDefinitions.length > 0 && (
            <EntityFilterBar
              filters={filterDefinitions}
              values={filterValues}
              pinned={filterDefinitions.map((f) => f.key)}
              onChange={(key, value) =>
                setFilterValues((prev) => {
                  if (value === undefined) {
                    const { [key]: _, ...rest } = prev;
                    return rest;
                  }
                  return { ...prev, [key]: value };
                })
              }
              onClear={() => setFilterValues({})}
            />
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col rounded-lg border">
          {isLoadingCatalog && catalogItems.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : catalogItems.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No se encontraron variantes.
              </p>
            </div>
          ) : (
            <>
              <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-3 sm:grid-cols-3 xl:grid-cols-4">
                {catalogItems.map((item) => (
                  <CatalogCard
                    key={item.id}
                    item={item}
                    isExcluded={excluded.has(item.id)}
                    isOutOfStock={!item.is_available}
                    isAdding={addingId === item.id}
                    onAdd={() => handleInstantAdd(item)}
                  />
                ))}
              </div>
              {hasMore && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Mostrando {catalogItems.length} de {totalCount} variantes.
                  Refina la búsqueda o los filtros para ver más.
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
