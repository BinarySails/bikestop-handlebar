import { useMemo, useState } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useListCustomersRequest } from "@/lib/api/api";
import type { PaginatedCustomerSummaryDataItem } from "@/lib/api/schemas";
import { useDebouncedValue } from "@/lib/use-debounced-value";

type Customer = PaginatedCustomerSummaryDataItem;

const EMPTY_CUSTOMERS: Customer[] = [];

export function CustomerCombobox({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());

  const { data: res, isLoading } = useListCustomersRequest(
    {
      search: debouncedSearch || undefined,
      limit: 20,
    },
    { swr: { keepPreviousData: true } }
  );

  const results = res?.status === 200 ? res.data.data : EMPTY_CUSTOMERS;

  const items = useMemo(() => {
    if (!value || results.some((customer) => customer.id === value.id)) {
      return results;
    }
    return [...results, value];
  }, [results, value]);

  return (
    <Combobox
      items={items}
      value={value}
      onValueChange={(customer: Customer | null) => {
        onChange(customer);
        setSearch("");
      }}
      onInputValueChange={(next: string, { reason }: { reason: string }) => {
        if (reason === "item-press") return;
        setSearch(next);
      }}
      itemToStringLabel={(customer: Customer) => customer.company_name}
      isItemEqualToValue={(a: Customer, b: Customer) => a.id === b.id}
      filter={null}
    >
      <ComboboxInput
        id={id}
        placeholder="Buscar por empresa, RFC o usuario"
        showClear
        className="w-full"
      />
      <ComboboxContent>
        <ComboboxEmpty>
          {isLoading ? "Buscando clientes..." : "No se encontraron clientes."}
        </ComboboxEmpty>
        <ComboboxList>
          {(customer: Customer) => (
            <ComboboxItem key={customer.id} value={customer}>
              <div className="flex flex-col">
                <span className="font-medium">{customer.company_name}</span>
                <span className="text-xs text-muted-foreground">
                  @{customer.username}
                  {customer.tax_id ? ` · ${customer.tax_id}` : null}
                </span>
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
