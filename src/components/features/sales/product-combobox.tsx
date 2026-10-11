import { useMemo, useState } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useListProductsRequest } from "@/lib/api/api";
import { ProductStatus, type Product } from "@/lib/api/schemas";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const EMPTY_PRODUCTS: Product[] = [];

export function ProductCombobox({
  id,
  value,
  onChange,
  onClear,
  disabled,
}: {
  id?: string;
  value: Product | null;
  onChange: (product: Product | null) => void;
  onClear?: () => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());

  const { data: res, isLoading } = useListProductsRequest(
    {
      status: ProductStatus.enable,
      search: debouncedSearch || undefined,
      limit: 100,
    },
    { swr: { keepPreviousData: true } }
  );

  const results = res?.status === 200 ? res.data.data : EMPTY_PRODUCTS;

  const items = useMemo(() => {
    if (!value || results.some((product) => product.id === value.id)) {
      return results;
    }
    return [...results, value];
  }, [results, value]);

  return (
    <Combobox
      disabled={disabled}
      items={items}
      value={value}
      onValueChange={(product: Product | null) => {
        if (!product) {
          onClear?.();
          return;
        }

        onChange(product);
        setSearch("");
      }}
      onInputValueChange={(next: string, { reason }: { reason: string }) => {
        if (reason === "item-press") return;
        setSearch(next);
      }}
      itemToStringLabel={(product: Product) => product.display_name}
      isItemEqualToValue={(a: Product, b: Product) => a.id === b.id}
      filter={null}
    >
      <ComboboxInput
        id={id}
        placeholder="Buscar producto"
        showClear
        className="w-full"
      />
      <ComboboxContent>
        <ComboboxEmpty>
          {isLoading ? "Buscando productos..." : "No se encontraron productos."}
        </ComboboxEmpty>
        <ComboboxList>
          {(product: Product) => (
            <ComboboxItem key={product.id} value={product}>
              <div className="flex min-w-0 items-center gap-2">
                {product.brand.image_url && (
                  <img
                    src={product.brand.image_url}
                    alt=""
                    className="size-9 shrink-0 rounded object-cover"
                    loading="lazy"
                  />
                )}
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">
                    {product.display_name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {product.brand.display_name} ·{" "}
                    {product.category.display_name}
                  </span>
                </div>
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
