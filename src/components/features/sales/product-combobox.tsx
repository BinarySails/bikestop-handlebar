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
  disabled,
}: {
  id?: string;
  value: Product | null;
  onChange: (product: Product | null) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());

  const { data: res, isLoading } = useListProductsRequest(
    {
      status: ProductStatus.enable,
      search: debouncedSearch || undefined,
      limit: 20,
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
              <div className="flex flex-col">
                <span className="font-medium">{product.display_name}</span>
                <span className="text-xs text-muted-foreground">
                  {product.brand.display_name} · {product.category.display_name}
                </span>
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
