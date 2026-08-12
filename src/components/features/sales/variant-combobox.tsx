import { useMemo } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useListVariantsByProductRequest } from "@/lib/api/api";
import {
  VariantStatus,
  type Variant,
  type VariantPrice,
} from "@/lib/api/schemas";
import { centsToPesos } from "@/lib/money";

const EMPTY_VARIANTS: Variant[] = [];

function findActiveRegularPrice(variant: Variant): VariantPrice | undefined {
  return (
    variant.prices.find(
      (price) =>
        price.price_type === "regular" && price.status === VariantStatus.enable
    ) ?? variant.prices.find((price) => price.status === VariantStatus.enable)
  );
}

export function VariantCombobox({
  id,
  productId,
  value,
  onChange,
  disabled,
}: {
  id?: string;
  productId: string | null;
  value: Variant | null;
  onChange: (variant: Variant | null) => void;
  disabled?: boolean;
}) {
  const { data: res, isLoading } = useListVariantsByProductRequest(
    productId ?? "",
    {
      swr: { enabled: Boolean(productId) },
    }
  );

  const all = res?.status === 200 ? res.data : EMPTY_VARIANTS;
  const items = useMemo(() => {
    const active = all.filter(
      (variant) =>
        variant.status === VariantStatus.enable &&
        (variant.prices.length === 0 ||
          variant.prices.some((price) => price.status === VariantStatus.enable))
    );

    if (!value || active.some((variant) => variant.id === value.id)) {
      return active;
    }
    return [...active, value];
  }, [all, value]);

  const selected = value;

  return (
    <Combobox
      items={items}
      value={selected}
      onValueChange={(variant: Variant | null) => {
        onChange(variant);
      }}
      itemToStringLabel={(variant: Variant) => `${variant.display_name}`}
      isItemEqualToValue={(a: Variant, b: Variant) => a.id === b.id}
      disabled={disabled || !productId}
    >
      <ComboboxInput
        id={id}
        placeholder={
          productId ? "Seleccionar variante" : "Selecciona un producto primero"
        }
        showClear
        className="w-full"
      />
      <ComboboxContent>
        <ComboboxEmpty>
          {isLoading
            ? "Cargando variantes..."
            : productId
              ? "No se encontraron variantes."
              : "Selecciona un producto primero."}
        </ComboboxEmpty>
        <ComboboxList>
          {(variant: Variant) => {
            const price = findActiveRegularPrice(variant);
            return (
              <ComboboxItem key={variant.id} value={variant}>
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="font-medium">{variant.display_name}</span>
                    <span className="text-xs text-muted-foreground">
                      SKU: {variant.sku}
                    </span>
                  </div>
                  {price && (
                    <span className="text-sm font-medium">
                      ${centsToPesos(price.amount).toFixed(2)}
                    </span>
                  )}
                </div>
              </ComboboxItem>
            );
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export { findActiveRegularPrice };
