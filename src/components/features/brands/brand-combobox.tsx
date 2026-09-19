import { useMemo, useState } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useListBrandsRequest } from "@/lib/api/api";
import { type Brand } from "@/lib/api/schemas";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const EMPTY_BRANDS: Brand[] = [];

export function BrandCombobox({
  id,
  value,
  onChange,
  disabled,
}: {
  id?: string;
  value: Brand | null;
  onChange: (brand: Brand | null) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());

  const { data: res, isLoading } = useListBrandsRequest({
    limit: 100,
  });

  const results = res?.status === 200 ? res.data.data : EMPTY_BRANDS;

  const items = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    const filtered = term
      ? results.filter((brand) =>
          brand.display_name.toLowerCase().includes(term)
        )
      : results;

    if (
      !value ||
      filtered.some((brand) => brand.id === value.id) ||
      results.some((brand) => brand.id === value.id)
    ) {
      return filtered;
    }
    return [...filtered, value];
  }, [results, value, debouncedSearch]);

  return (
    <Combobox
      items={items}
      value={value}
      onValueChange={(brand: Brand | null) => {
        onChange(brand);
        setSearch("");
      }}
      onInputValueChange={(next: string, { reason }: { reason: string }) => {
        if (reason === "item-press") return;
        setSearch(next);
      }}
      itemToStringLabel={(brand: Brand) => brand.display_name}
      isItemEqualToValue={(a: Brand, b: Brand) => a.id === b.id}
      filter={null}
      disabled={disabled}
    >
      <ComboboxInput
        id={id}
        placeholder="Buscar marca"
        showClear
        className="w-full"
      />
      <ComboboxContent>
        <ComboboxEmpty>
          {isLoading ? "Buscando marcas..." : "No se encontraron marcas."}
        </ComboboxEmpty>
        <ComboboxList>
          {(brand: Brand) => (
            <ComboboxItem key={brand.id} value={brand}>
              {brand.display_name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
