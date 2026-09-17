import { useMemo, useState } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useListWarehousesRequest } from "@/lib/api/api";
import { WarehouseStatus, type WarehouseResponse } from "@/lib/api/schemas";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const EMPTY_WAREHOUSES: WarehouseResponse[] = [];

export function WarehouseCombobox({
  id,
  value,
  onChange,
  disabled,
  excludeId,
}: {
  id?: string;
  value: WarehouseResponse | null;
  onChange: (warehouse: WarehouseResponse | null) => void;
  disabled?: boolean;
  excludeId?: string;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());

  const { data: res, isLoading } = useListWarehousesRequest(
    {
      status: WarehouseStatus.enable,
    },
    { swr: { keepPreviousData: true } }
  );

  const results = res?.status === 200 ? res.data : EMPTY_WAREHOUSES;

  const items = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    const filtered = term
      ? results.filter((warehouse) =>
          warehouse.name.toLowerCase().includes(term)
        )
      : results;

    const excluded = excludeId
      ? filtered.filter((warehouse) => warehouse.id !== excludeId)
      : filtered;

    if (
      !value ||
      excluded.some((warehouse) => warehouse.id === value.id) ||
      results.some((warehouse) => warehouse.id === value.id)
    ) {
      return excluded;
    }
    return [...excluded, value];
  }, [results, value, debouncedSearch, excludeId]);

  return (
    <Combobox
      items={items}
      value={value}
      onValueChange={(warehouse: WarehouseResponse | null) => {
        onChange(warehouse);
        setSearch("");
      }}
      onInputValueChange={(next: string, { reason }: { reason: string }) => {
        if (reason === "item-press") return;
        setSearch(next);
      }}
      itemToStringLabel={(warehouse: WarehouseResponse) => warehouse.name}
      isItemEqualToValue={(a: WarehouseResponse, b: WarehouseResponse) =>
        a.id === b.id
      }
      filter={null}
      disabled={disabled}
    >
      <ComboboxInput
        id={id}
        placeholder="Buscar almacén"
        showClear
        className="w-full"
      />
      <ComboboxContent>
        <ComboboxEmpty>
          {isLoading ? "Buscando almacenes..." : "No se encontraron almacenes."}
        </ComboboxEmpty>
        <ComboboxList>
          {(warehouse: WarehouseResponse) => (
            <ComboboxItem key={warehouse.id} value={warehouse}>
              <div className="flex flex-col">
                <span className="font-medium">{warehouse.name}</span>
                {warehouse.code && (
                  <span className="text-xs text-muted-foreground">
                    Código: {warehouse.code}
                  </span>
                )}
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
