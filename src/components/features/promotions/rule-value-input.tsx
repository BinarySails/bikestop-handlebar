import { useMemo, useState } from "react";
import { X } from "lucide-react";

import { ProductCombobox } from "@/components/features/sales/product-combobox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import {
  useGetCategoriesRequest,
  useListBrandsRequest,
  useListCustomersRequest,
  useListProductsRequest,
  useListVariantsRequest,
} from "@/lib/api/api";
import {
  ProductStatus,
  type Product,
  type RuleOperator,
  type Variant,
  type VariantPrice,
  VariantStatus,
} from "@/lib/api/schemas";
import { centsToPesos } from "@/lib/money";
import { useDebouncedValue } from "@/lib/use-debounced-value";

import { isMultiValueOperator, type RuleAttributeKey } from "./promotion-form";

type UuidSource = {
  id: string;
  label: string;
  sublabel?: string;
};

function useUuidItems(
  attribute: RuleAttributeKey,
  search: string
): { items: UuidSource[]; isLoading: boolean } {
  const products = useListProductsRequest(
    {
      status: ProductStatus.enable,
      search: search || undefined,
      limit: 20,
    },
    { swr: { enabled: attribute === "product_id" } }
  );
  const categories = useGetCategoriesRequest(
    { display_name: search || null },
    { swr: { enabled: attribute === "product_category_id" } }
  );
  const brands = useListBrandsRequest(
    { display_name: search || undefined, limit: 20 },
    { swr: { enabled: attribute === "product_brand_id" } }
  );
  const customers = useListCustomersRequest(
    { search: search || undefined, limit: 20 },
    { swr: { enabled: attribute === "customer_id" } }
  );

  if (attribute === "product_id") {
    const data = products.data?.status === 200 ? products.data.data.data : [];
    return {
      isLoading: products.isLoading,
      items: data.map((product) => ({
        id: product.id,
        label: product.display_name,
        sublabel: [product.brand?.display_name, product.category?.display_name]
          .filter(Boolean)
          .join(" · "),
      })),
    };
  }
  if (attribute === "product_category_id") {
    const data =
      categories.data?.status === 200 ? categories.data.data.categories : [];
    return {
      isLoading: categories.isLoading,
      items: data.map((category) => ({
        id: category.id,
        label: category.display_name,
      })),
    };
  }
  if (attribute === "product_brand_id") {
    const data = brands.data?.status === 200 ? brands.data.data.data : [];
    return {
      isLoading: brands.isLoading,
      items: data.map((brand) => ({
        id: brand.id,
        label: brand.display_name,
      })),
    };
  }
  const data = customers.data?.status === 200 ? customers.data.data.data : [];
  return {
    isLoading: customers.isLoading,
    items: data.map((customer) => ({
      id: customer.id,
      label: customer.company_name,
      sublabel: customer.username || undefined,
    })),
  };
}

function SelectedChips({
  ids,
  labelFor,
  onRemove,
}: {
  ids: string[];
  labelFor: (id: string) => string | undefined;
  onRemove: (id: string) => void;
}) {
  if (ids.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((id) => (
        <span
          key={id}
          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium"
        >
          {labelFor(id) ?? id}
          <button
            type="button"
            aria-label={`Quitar ${labelFor(id) ?? id}`}
            className="text-muted-foreground hover:text-foreground"
            onClick={() => onRemove(id)}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

function UuidValueInput({
  attribute,
  operator,
  values,
  onChange,
  disabled,
}: {
  attribute: RuleAttributeKey;
  operator: RuleOperator;
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());
  const { items, isLoading } = useUuidItems(attribute, debouncedSearch);
  const multi = isMultiValueOperator(operator);

  const itemsWithSelection = useMemo(() => {
    const selected = items.filter((item) => values.includes(item.id));
    const missing = values
      .filter((id) => !items.some((item) => item.id === id))
      .map((id) => ({ id, label: id }));
    return [...items, ...selected, ...missing];
  }, [items, values]);

  const available = useMemo(
    () => itemsWithSelection.filter((item) => !values.includes(item.id)),
    [itemsWithSelection, values]
  );

  const placeholder =
    attribute === "customer_id"
      ? "Buscar cliente"
      : attribute === "product_category_id"
        ? "Buscar categoría"
        : attribute === "product_brand_id"
          ? "Buscar marca"
          : "Buscar producto";

  const labelFor = (id: string) =>
    itemsWithSelection.find((item) => item.id === id)?.label;

  if (multi) {
    return (
      <div className="space-y-2">
        <SelectedChips
          ids={values}
          labelFor={labelFor}
          onRemove={(id) => onChange(values.filter((value) => value !== id))}
        />
        <Combobox
          items={available}
          value={null}
          onValueChange={(item: UuidSource | null) => {
            if (item && !values.includes(item.id)) {
              onChange([...values, item.id]);
            }
            setSearch("");
          }}
          onInputValueChange={(next: string) => setSearch(next)}
          itemToStringLabel={(item: UuidSource) => item.label}
          isItemEqualToValue={(a: UuidSource, b: UuidSource) => a.id === b.id}
          filter={null}
        >
          <ComboboxInput
            placeholder={`Agregar ${placeholder.toLowerCase()}`}
            showClear
            className="w-full"
          />
          <ComboboxContent>
            <ComboboxEmpty>
              {isLoading ? "Buscando..." : "No se encontraron resultados."}
            </ComboboxEmpty>
            <ComboboxList>
              {(item: UuidSource) => (
                <ComboboxItem key={item.id} value={item}>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.label}</span>
                    {item.sublabel && (
                      <span className="text-xs text-muted-foreground">
                        {item.sublabel}
                      </span>
                    )}
                  </div>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    );
  }

  const selected = values[0]
    ? (itemsWithSelection.find((item) => item.id === values[0]) ?? {
        id: values[0],
        label: values[0],
      })
    : null;

  return (
    <Combobox
      items={itemsWithSelection}
      value={selected}
      onValueChange={(item: UuidSource | null) => {
        onChange(item ? [item.id] : []);
        setSearch("");
      }}
      onInputValueChange={(next: string) => setSearch(next)}
      itemToStringLabel={(item: UuidSource) => item.label}
      isItemEqualToValue={(a: UuidSource, b: UuidSource) => a.id === b.id}
      filter={null}
      disabled={disabled}
    >
      <ComboboxInput placeholder={placeholder} showClear className="w-full" />
      <ComboboxContent>
        <ComboboxEmpty>
          {isLoading ? "Buscando..." : "No se encontraron resultados."}
        </ComboboxEmpty>
        <ComboboxList>
          {(item: UuidSource) => (
            <ComboboxItem key={item.id} value={item}>
              <div className="flex flex-col">
                <span className="font-medium">{item.label}</span>
                {item.sublabel && (
                  <span className="text-xs text-muted-foreground">
                    {item.sublabel}
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

function findActiveRegularPrice(variant: Variant): VariantPrice | undefined {
  return (
    variant.prices.find(
      (price) =>
        price.price_type === "regular" && price.status === VariantStatus.enable
    ) ?? variant.prices.find((price) => price.status === VariantStatus.enable)
  );
}

function VariantItem({ variant }: { variant: Variant }) {
  const price = findActiveRegularPrice(variant);
  return (
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
  );
}

function VariantValueInput({
  operator,
  values,
  onChange,
  disabled,
}: {
  operator: RuleOperator;
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const multi = isMultiValueOperator(operator);

  const { data: res, isLoading } = useListVariantsRequest(
    product?.id ?? "",
    undefined,
    { swr: { enabled: Boolean(product) } }
  );
  const all = res?.status === 200 ? res.data : [];
  const variants = all.filter(
    (variant) =>
      variant.status === VariantStatus.enable &&
      (variant.prices.length === 0 ||
        variant.prices.some((price) => price.status === VariantStatus.enable))
  );

  const labelFor = (id: string) =>
    all.find((variant) => variant.id === id)?.display_name;

  const selectedVariant = values[0]
    ? (all.find((variant) => variant.id === values[0]) ?? null)
    : null;

  const picker = (
    <Combobox
      items={variants}
      value={selectedVariant}
      onValueChange={(variant: Variant | null) => {
        if (multi) {
          if (variant && !values.includes(variant.id)) {
            onChange([...values, variant.id]);
          }
          return;
        }
        onChange(variant ? [variant.id] : []);
      }}
      itemToStringLabel={(variant: Variant) => variant.display_name}
      isItemEqualToValue={(a: Variant, b: Variant) => a.id === b.id}
      disabled={disabled || !product}
    >
      <ComboboxInput
        placeholder={
          product ? "Seleccionar variante" : "Selecciona un producto primero"
        }
        showClear
        className="w-full"
      />
      <ComboboxContent>
        <ComboboxEmpty>
          {isLoading
            ? "Cargando variantes..."
            : product
              ? "No se encontraron variantes."
              : "Selecciona un producto primero."}
        </ComboboxEmpty>
        <ComboboxList>
          {(variant: Variant) => (
            <ComboboxItem key={variant.id} value={variant}>
              <VariantItem variant={variant} />
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );

  if (multi) {
    return (
      <div className="space-y-2">
        <SelectedChips
          ids={values}
          labelFor={labelFor}
          onRemove={(id) => onChange(values.filter((value) => value !== id))}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <ProductCombobox value={product} onChange={setProduct} />
          {picker}
        </div>
        {isLoading && (
          <p className="text-xs text-muted-foreground">Cargando variantes...</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <ProductCombobox value={product} onChange={setProduct} />
      {picker}
    </div>
  );
}

export function RuleValueInput({
  attribute,
  operator,
  values,
  onChange,
  disabled,
}: {
  attribute: RuleAttributeKey;
  operator: RuleOperator;
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}) {
  switch (attribute) {
    case "customer_id":
    case "product_id":
    case "product_category_id":
    case "product_brand_id":
      return (
        <UuidValueInput
          attribute={attribute}
          operator={operator}
          values={values}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "variant_id":
      return (
        <VariantValueInput
          operator={operator}
          values={values}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "variant_property":
      return (
        <Input
          value={values[0] ?? ""}
          onChange={(event) =>
            onChange(event.target.value ? [event.target.value] : [])
          }
          disabled={disabled}
          placeholder="Valor de la propiedad"
        />
      );
    case "order_subtotal":
    case "line_unit_price":
      return (
        <Input
          type="number"
          min={0}
          step="0.01"
          value={values[0] ?? ""}
          onChange={(event) =>
            onChange(event.target.value ? [event.target.value] : [])
          }
          disabled={disabled}
          placeholder="Precio en pesos"
        />
      );
    case "line_quantity":
      return (
        <Input
          type="number"
          min={0}
          step={1}
          value={values[0] ?? ""}
          onChange={(event) =>
            onChange(event.target.value ? [event.target.value] : [])
          }
          disabled={disabled}
          placeholder="Cantidad"
        />
      );
  }

  return null;
}
