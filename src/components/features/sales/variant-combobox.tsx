import { useMemo } from "react";
import { ImageOff } from "lucide-react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useListVariantsRequest } from "@/lib/api/api";
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
  onClear,
  disabled,
}: {
  id?: string;
  productId: string | null;
  value: Variant | null;
  onChange: (variant: Variant | null) => void;
  onClear?: () => void;
  disabled?: boolean;
}) {
  const { data: res, isLoading } = useListVariantsRequest(
    productId ?? "",
    undefined,
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
  const selectedImage = selected?.images[0]?.image_url;

  return (
    <Combobox
      items={items}
      value={selected}
      onValueChange={(variant: Variant | null) => {
        if (!variant) {
          onClear?.();
          return;
        }
        onChange(variant);
      }}
      itemToStringLabel={(variant: Variant) => `${variant.display_name}`}
      isItemEqualToValue={(a: Variant, b: Variant) => a.id === b.id}
      disabled={disabled || !productId}
    >
      <div className="relative w-full">
        <ComboboxInput
          id={id}
          placeholder={
            productId
              ? "Seleccionar variante"
              : "Selecciona un producto primero"
          }
          showClear
          className="w-full"
        />
        {selectedImage ? (
          <img
            src={selectedImage}
            alt={selected?.display_name ?? ""}
            className="pointer-events-none absolute top-1/2 left-2 size-6 -translate-y-1/2 rounded object-cover"
          />
        ) : selected ? (
          <div className="pointer-events-none absolute top-1/2 left-2 flex size-6 -translate-y-1/2 items-center justify-center rounded bg-muted text-muted-foreground">
            <ImageOff className="size-3.5" />
          </div>
        ) : null}
      </div>
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
                  <div className="flex items-center gap-3">
                    {variant.images[0]?.image_url && (
                      <img
                        src={variant.images[0].image_url}
                        alt={variant.display_name}
                        className="size-10 rounded-md object-cover"
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {variant.display_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        C.: {variant.total_inventory}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        SKU: {variant.sku}
                      </span>
                    </div>
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
