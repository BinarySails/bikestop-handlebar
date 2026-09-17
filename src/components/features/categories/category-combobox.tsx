import { useMemo, useState } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useGetCategoriesRequest } from "@/lib/api/api";
import { type Category } from "@/lib/api/schemas";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const EMPTY_CATEGORIES: Category[] = [];

export function CategoryCombobox({
  id,
  value,
  onChange,
  disabled,
}: {
  id?: string;
  value: Category | null;
  onChange: (category: Category | null) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());

  const { data: res, isLoading } = useGetCategoriesRequest({
    display_name: debouncedSearch || undefined,
  });

  const results = res?.status === 200 ? res.data.categories : EMPTY_CATEGORIES;

  const items = useMemo(() => {
    if (!value || results.some((category) => category.id === value.id)) {
      return results;
    }
    return [...results, value];
  }, [results, value]);

  return (
    <Combobox
      items={items}
      value={value}
      onValueChange={(category: Category | null) => {
        onChange(category);
        setSearch("");
      }}
      onInputValueChange={(next: string, { reason }: { reason: string }) => {
        if (reason === "item-press") return;
        setSearch(next);
      }}
      itemToStringLabel={(category: Category) => category.display_name}
      isItemEqualToValue={(a: Category, b: Category) => a.id === b.id}
      filter={null}
      disabled={disabled}
    >
      <ComboboxInput
        id={id}
        placeholder="Buscar categoría"
        showClear
        className="w-full"
      />
      <ComboboxContent>
        <ComboboxEmpty>
          {isLoading
            ? "Buscando categorías..."
            : "No se encontraron categorías."}
        </ComboboxEmpty>
        <ComboboxList>
          {(category: Category) => (
            <ComboboxItem key={category.id} value={category}>
              {category.display_name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
