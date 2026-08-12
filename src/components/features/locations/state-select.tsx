import { useMemo } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useListStatesRequest } from "@/lib/api/api";
import type { State } from "@/lib/api/schemas";

const EMPTY_STATES: State[] = [];

export function StateSelect({
  id,
  value,
  onValueChange,
  disabled,
  placeholder = "Buscar estado",
  "aria-invalid": ariaInvalid,
}: {
  id?: string;
  value?: string;
  onValueChange?: (value: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  "aria-invalid"?: boolean;
}) {
  const { data: res, isLoading } = useListStatesRequest();

  const states =
    res?.status === 200 ? (res.data ?? EMPTY_STATES) : EMPTY_STATES;

  const items = useMemo(() => {
    if (!value || states.some((state) => state.display_name === value)) {
      return states;
    }
    return [...states, { id: value, display_name: value, created_at: "" }];
  }, [states, value]);

  const selected = useMemo(() => {
    if (!value) return null;
    return items.find((state) => state.display_name === value) ?? null;
  }, [items, value]);

  const isLoadingStates = isLoading && states.length === 0;

  return (
    <Combobox
      items={items}
      value={selected}
      onValueChange={(state: State | null) => {
        onValueChange?.(state ? state.display_name : null);
      }}
      itemToStringLabel={(state: State) => state.display_name}
      itemToStringValue={(state: State) => state.display_name}
      isItemEqualToValue={(a: State, b: State) =>
        a.display_name === b.display_name
      }
      disabled={disabled || isLoadingStates}
    >
      <ComboboxInput
        id={id}
        placeholder={isLoadingStates ? "Cargando estados..." : placeholder}
        showClear
        className="w-full"
        aria-invalid={ariaInvalid}
      />
      <ComboboxContent>
        <ComboboxEmpty>
          {isLoadingStates
            ? "Cargando estados..."
            : res?.status !== undefined && res.status !== 200
              ? "No se pudieron cargar los estados."
              : "No se encontraron estados."}
        </ComboboxEmpty>
        <ComboboxList>
          {(state: State) => (
            <ComboboxItem key={state.id} value={state}>
              {state.display_name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
