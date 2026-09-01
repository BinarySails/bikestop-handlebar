import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2Icon } from "lucide-react";

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

const PAGE_SIZE = 20;

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
  const [page, setPage] = useState(0);
  const [allItems, setAllItems] = useState<Customer[]>([]);

  const {
    data: res,
    isLoading,
    isValidating,
  } = useListCustomersRequest(
    {
      search: debouncedSearch || undefined,
      page,
      limit: PAGE_SIZE,
    },
    { swr: { keepPreviousData: true } }
  );

  useEffect(() => {
    setPage(0);
    setAllItems([]);
  }, [debouncedSearch]);

  useEffect(() => {
    if (res?.status === 200) {
      const data = res.data.data;
      setAllItems((prev) => (page === 1 ? data : [...prev, ...data]));
    }
  }, [res, page]);

  const total = res?.status === 200 ? res.data.total : 0;
  const hasMore = page * PAGE_SIZE < total;

  const fetchingRef = useRef(false);
  fetchingRef.current = isValidating;

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (
        scrollHeight - scrollTop - clientHeight < 50 &&
        hasMore &&
        !fetchingRef.current
      ) {
        setPage((prev) => prev + 1);
      }
    },
    [hasMore]
  );

  const items = useMemo(() => {
    if (!value || allItems.some((customer) => customer.id === value.id)) {
      return allItems;
    }
    return [...allItems, value];
  }, [allItems, value]);

  const isFetchingNextPage = isValidating && page > 1;

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
        <ComboboxList onScroll={handleScroll}>
          {items.map((customer) => (
            <ComboboxItem key={customer.id} value={customer}>
              <div className="flex flex-col">
                <span className="font-medium">{customer.company_name}</span>
                <span className="text-xs text-muted-foreground">
                  {customer.tax_id ? `${customer.tax_id}` : null}
                </span>
              </div>
            </ComboboxItem>
          ))}
          {isFetchingNextPage && (
            <li className="flex items-center justify-center py-2 text-sm text-muted-foreground">
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Cargando más...
            </li>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
