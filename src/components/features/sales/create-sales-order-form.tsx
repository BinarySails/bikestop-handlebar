import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CustomerCombobox } from "@/components/features/sales/customer-combobox";
import { ProductCombobox } from "@/components/features/sales/product-combobox";
import {
  VariantCombobox,
  findActiveRegularPrice,
} from "@/components/features/sales/variant-combobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSalesOrderRequest } from "@/lib/api/api";
import {
  type PaginatedCustomerSummaryDataItem,
  type CreateSalesOrderRequest,
  type Product,
  ProductStatus,
  type SalesOrder,
  type Variant,
  VariantStatus,
} from "@/lib/api/schemas";
import { centsToPesosString, pesosToCents } from "@/lib/money";
import { CreateSalesOrderRequestBody } from "@/lib/api/zods";

const MAX_PRICE_DECIMALS = 2;
const DEFAULT_TAX_PERCENT = "16";

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

type AddressFormValues = {
  country: string;
  state: string;
  city: string;
  postal_code: string;
  address: string;
};

type LineFormValues = {
  product: Product | null;
  variant: Variant | null;
  description: string;
  quantity: string;
  unit_price: string;
  discount_percent: string;
  tax_rate: string;
};

type SalesOrderFormValues = {
  customer: PaginatedCustomerSummaryDataItem | null;
  billing: AddressFormValues;
  shipping_same_as_billing: boolean;
  shipping: AddressFormValues;
  order_date: Date;
  comments: string;
  lines: LineFormValues[];
};

function countDecimals(value: string): number {
  return value.includes(".") ? (value.split(".")[1]?.length ?? 0) : 0;
}

function percentToBasisPoints(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const number = Number(trimmed);
  if (Number.isNaN(number) || number < 0) return 0;
  return Math.round(number * 100);
}

function validateRequired(
  value: string,
  label: string,
  min: number
): string | undefined {
  if (!value.trim()) return `${label} es obligatorio.`;
  if (value.trim().length < min) {
    return `${label} debe tener al menos ${min} caracteres.`;
  }
  return undefined;
}

function validateQuantity(value: string): string | undefined {
  if (!value.trim()) return "La cantidad es obligatoria.";
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    return "La cantidad debe ser un entero mayor o igual a 1.";
  }
  return undefined;
}

function validateUnitPrice(value: string): string | undefined {
  if (!value.trim()) return "El precio unitario es obligatorio.";
  const number = Number(value);
  if (Number.isNaN(number) || number < 0) {
    return "El precio debe ser mayor o igual a 0.";
  }
  if (countDecimals(value) > MAX_PRICE_DECIMALS) {
    return "El precio solo puede tener hasta 2 decimales.";
  }
  return undefined;
}

function validatePercent(value: string, label: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const number = Number(trimmed);
  if (Number.isNaN(number) || number < 0 || number > 100) {
    return `${label} debe estar entre 0 y 100.`;
  }
  if (countDecimals(value) > MAX_PRICE_DECIMALS) {
    return `${label} solo puede tener hasta 2 decimales.`;
  }
  return undefined;
}

function computeLineTotals(line: LineFormValues) {
  const quantity = Number(line.quantity);
  const quantityInt = Number.isInteger(quantity) && quantity > 0 ? quantity : 0;

  const priceNumber = Number(line.unit_price);
  const unitPriceCents =
    !line.unit_price.trim() || Number.isNaN(priceNumber) || priceNumber < 0
      ? 0
      : pesosToCents(priceNumber);

  const discountBp = percentToBasisPoints(line.discount_percent);
  const taxBp = percentToBasisPoints(line.tax_rate);

  const gross = unitPriceCents * quantityInt;
  const discount = Math.trunc((gross * discountBp) / 10000);
  const taxable = gross - discount;
  const tax = Math.trunc((taxable * taxBp) / 10000);

  return {
    gross,
    discount,
    tax,
    total: taxable + tax,
  };
}

const defaultAddress: AddressFormValues = {
  country: "México",
  state: "",
  city: "",
  postal_code: "",
  address: "",
};

const defaultValues: SalesOrderFormValues = {
  customer: null,
  billing: defaultAddress,
  shipping_same_as_billing: true,
  shipping: defaultAddress,
  order_date: new Date(),
  comments: "",
  lines: [],
};

function addressValues(
  address: SalesOrder["billing_address"]
): AddressFormValues {
  return {
    country: address.country,
    state: address.state,
    city: address.city,
    postal_code: address.postal_code,
    address: address.address,
  };
}

function sameAddress(
  first: SalesOrder["billing_address"],
  second: SalesOrder["shipping_address"]
) {
  return (
    first.country === second.country &&
    first.state === second.state &&
    first.city === second.city &&
    first.postal_code === second.postal_code &&
    first.address === second.address
  );
}

function valuesFromOrder(order: SalesOrder): SalesOrderFormValues {
  return {
    customer: {
      id: order.customer.customer_id,
      company_name: order.customer.name,
      email: null,
      tax_id: "",
      username: "",
    },
    billing: addressValues(order.billing_address),
    shipping_same_as_billing: sameAddress(
      order.billing_address,
      order.shipping_address
    ),
    shipping: addressValues(order.shipping_address),
    order_date: new Date(order.order_date),
    comments: order.comments ?? "",
    lines: order.lines.map((line) => ({
      product: {
        id: line.product_id,
        display_name: line.description,
        status: ProductStatus.enable,
        brand: { display_name: "" },
        category: { display_name: "" },
      } as Product,
      variant: {
        id: line.variant_id,
        product_id: line.product_id,
        display_name: line.description,
        sku: line.variant_id,
        prices: [],
        properties: [],
        status: VariantStatus.enable,
        image_url: "",
        created_at: order.created_at,
        updated_at: order.updated_at,
      } as Variant,
      description: line.description,
      quantity: String(line.quantity),
      unit_price: centsToPesosString(line.unit_price),
      discount_percent:
        line.discount_percent == null
          ? ""
          : String(line.discount_percent / 100),
      tax_rate: String(line.tax_rate / 100),
    })),
  };
}

export function CreateSalesOrderForm({
  order,
  commentAuthor = "Usuario",
  onAddComment,
  onSaveDraft,
}: {
  order?: SalesOrder;
  commentAuthor?: string;
  onAddComment?: (comment: string) => Promise<void>;
  onSaveDraft?: (payload: CreateSalesOrderRequest) => Promise<void>;
} = {}) {
  const navigate = useNavigate();
  const { trigger } = useCreateSalesOrderRequest();
  const isDetail = Boolean(order);
  const editable =
    !order || order.status === "draft" || order.status === "quote";
  const isReadOnlyOrder = Boolean(order) && !editable;
  const canAddComment =
    Boolean(order) &&
    [
      "draft",
      "quote",
      "confirmed",
      "partially_fulfilled",
      "fulfilled",
    ].includes(order?.status ?? "");
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const messages = (order?.comments ?? "")
    .split(/\n+/)
    .map((comment) => comment.trim())
    .filter(Boolean);

  async function addComment() {
    const comment = newComment.trim();
    if (!comment || !onAddComment) return;

    setIsAddingComment(true);
    try {
      await onAddComment(comment);
      setNewComment("");
      toast.success("Comentario agregado");
    } catch {
      toast.error("No se pudo agregar el comentario");
    } finally {
      setIsAddingComment(false);
    }
  }

  const form = useForm({
    defaultValues: order ? valuesFromOrder(order) : defaultValues,
    onSubmit: async ({ value }) => {
      const completeLines = value.lines.filter(
        (line): line is LineFormValues & { variant: Variant } =>
          line.variant !== null
      );

      if (!value.customer) {
        toast.error("Selecciona un cliente.");
        return;
      }

      if (completeLines.length === 0) {
        toast.error("Agrega al menos una línea con una variante seleccionada.");
        return;
      }

      const billingAddress = {
        country: value.billing.country.trim(),
        state: value.billing.state.trim(),
        city: value.billing.city.trim(),
        postal_code: value.billing.postal_code.trim(),
        address: value.billing.address.trim(),
      };

      const shippingAddress = value.shipping_same_as_billing
        ? billingAddress
        : {
            country: value.shipping.country.trim(),
            state: value.shipping.state.trim(),
            city: value.shipping.city.trim(),
            postal_code: value.shipping.postal_code.trim(),
            address: value.shipping.address.trim(),
          };

      const payload = {
        customer_id: value.customer.id,
        billing_address: billingAddress,
        shipping_address: shippingAddress,
        order_date: value.order_date.toISOString(),
        comments: value.comments.trim() || null,
        lines: completeLines.map((line) => ({
          variant_id: line.variant.id,
          description: line.description.trim(),
          quantity: Number(line.quantity),
          unit_price: pesosToCents(Number(line.unit_price)),
          discount_percent: line.discount_percent.trim()
            ? percentToBasisPoints(line.discount_percent)
            : null,
          tax_rate: percentToBasisPoints(line.tax_rate),
        })),
      };

      const parseResult =
        await CreateSalesOrderRequestBody.safeParseAsync(payload);
      if (!parseResult.success) {
        toast.error(parseResult.error.issues[0]?.message ?? "Datos inválidos.");
        return;
      }

      if (order) {
        if (order.status === "draft" && onSaveDraft) {
          try {
            await onSaveDraft(parseResult.data);
            toast.success("Cambios guardados");
          } catch {
            toast.error("No se pudieron guardar los cambios");
          }
        }
        return;
      }

      try {
        const result = await trigger(parseResult.data);

        if (result.status === 201) {
          toast.success(`Orden ${result.data.order_number} creada.`);
          navigate({ to: "/sales" });
        } else {
          const errorData =
            "data" in result &&
            typeof result.data === "object" &&
            result.data !== null &&
            "message" in result.data
              ? (result.data as { message?: string }).message
              : undefined;
          toast.error(errorData ?? "Error al crear la orden.");
        }
      } catch {
        toast.error("Error al crear la orden.");
      }
    },
  });

  function renderAddressFields(
    prefix: "billing" | "shipping",
    disabled?: boolean
  ) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <form.Field
          name={`${prefix}.country`}
          validators={{
            onSubmit: ({ value }) => validateRequired(value, "El país", 2),
          }}
        >
          {(field) => (
            <div className="grid gap-1.5">
              <Label htmlFor={field.name}>País</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="México"
                disabled={disabled}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              {field.state.meta.errors[0] && (
                <p className="text-xs text-destructive">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field
          name={`${prefix}.state`}
          validators={{
            onSubmit: ({ value }) => validateRequired(value, "El estado", 2),
          }}
        >
          {(field) => (
            <div className="grid gap-1.5">
              <Label htmlFor={field.name}>Estado</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="Jalisco"
                disabled={disabled}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              {field.state.meta.errors[0] && (
                <p className="text-xs text-destructive">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field
          name={`${prefix}.city`}
          validators={{
            onSubmit: ({ value }) => validateRequired(value, "La ciudad", 2),
          }}
        >
          {(field) => (
            <div className="grid gap-1.5">
              <Label htmlFor={field.name}>Ciudad</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="Guadalajara"
                disabled={disabled}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              {field.state.meta.errors[0] && (
                <p className="text-xs text-destructive">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field
          name={`${prefix}.postal_code`}
          validators={{
            onSubmit: ({ value }) =>
              validateRequired(value, "El código postal", 1),
          }}
        >
          {(field) => (
            <div className="grid gap-1.5">
              <Label htmlFor={field.name}>Código postal</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="44100"
                disabled={disabled}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              {field.state.meta.errors[0] && (
                <p className="text-xs text-destructive">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field
          name={`${prefix}.address`}
          validators={{
            onSubmit: ({ value }) => validateRequired(value, "La dirección", 3),
          }}
        >
          {(field) => (
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor={field.name}>Dirección</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="Av. Vallarta 1234"
                disabled={disabled}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              {field.state.meta.errors[0] && (
                <p className="text-xs text-destructive">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <fieldset disabled={!editable} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <form.Field
              name="customer"
              validators={{
                onSubmit: ({ value }) => {
                  if (!value) return "Selecciona un cliente.";
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="grid gap-1.5">
                  <Label htmlFor={field.name}>Cliente</Label>
                  <CustomerCombobox
                    id={field.name}
                    value={field.state.value}
                    onChange={(customer) => field.handleChange(customer)}
                  />
                  {field.state.meta.errors[0] && (
                    <p className="text-xs text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Dirección de facturación</CardTitle>
            </CardHeader>
            <CardContent>{renderAddressFields("billing")}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dirección de envío</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field name="shipping_same_as_billing">
                {(field) => (
                  <Label
                    htmlFor={field.name}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) =>
                        field.handleChange(checked === true)
                      }
                    />
                    Usar la dirección de facturación
                  </Label>
                )}
              </form.Field>

              <form.Subscribe
                selector={(state) => state.values.shipping_same_as_billing}
              >
                {(shippingSameAsBilling) =>
                  shippingSameAsBilling ? (
                    <p className="text-sm text-muted-foreground">
                      Se usará la misma dirección para el envío.
                    </p>
                  ) : (
                    renderAddressFields("shipping")
                  )
                }
              </form.Subscribe>
            </CardContent>
          </Card>
        </div>
      </fieldset>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la orden</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <fieldset disabled={!editable} className="contents">
            <form.Field name="order_date">
              {(field) => (
                <Label className="grid items-start gap-1.5 sm:col-span-2">
                  <span>Fecha de orden</span>
                  <DatePicker
                    value={field.state.value}
                    onChange={(date) => field.handleChange(date ?? new Date())}
                    placeholder="Seleccionar fecha"
                  />
                </Label>
              )}
            </form.Field>
          </fieldset>

          {isDetail ? (
            <div className="space-y-4 sm:col-span-2">
              <Label>Comentarios</Label>
              <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                {messages.length ? (
                  messages.map((message, index) => (
                    <article
                      key={`${index}-${message}`}
                      className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3"
                    >
                      <p className="mb-1 text-xs font-semibold text-muted-foreground">
                        {commentAuthor}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{message}</p>
                    </article>
                  ))
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No hay comentarios registrados.
                  </p>
                )}
              </div>

              {canAddComment && (
                <div className="space-y-3 border-t pt-4">
                  <Label htmlFor="sales-order-comment">
                    Agregar comentario
                  </Label>
                  <Textarea
                    id="sales-order-comment"
                    value={newComment}
                    onChange={(event) => setNewComment(event.target.value)}
                    placeholder="Escribe un comentario..."
                    rows={3}
                    disabled={isAddingComment}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      disabled={isAddingComment || !newComment.trim()}
                      onClick={() => void addComment()}
                    >
                      {isAddingComment ? "Agregando..." : "Agregar comentario"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form.Field name="comments">
              {(field) => (
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor={field.name}>Comentarios</Label>
                  <Textarea
                    id={field.name}
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Notas u observaciones de la orden"
                    rows={3}
                  />
                </div>
              )}
            </form.Field>
          )}
        </CardContent>
      </Card>

      {isReadOnlyOrder && order && (
        <Button
          type="button"
          className="h-12 w-full font-semibold"
          render={
            <Link
              to="/sales/$orderId/payments-invoices"
              params={{ orderId: order.id }}
            />
          }
        >
          Pagos y facturas
        </Button>
      )}

      <fieldset disabled={!editable} className="space-y-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Productos</CardTitle>
            <form.Field
              name="lines"
              validators={{
                onSubmit: ({ value }) => {
                  if (value.length === 0) {
                    return "Agrega al menos una línea.";
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    field.pushValue({
                      product: null,
                      variant: null,
                      description: "",
                      quantity: "1",
                      unit_price: "",
                      discount_percent: "",
                      tax_rate: DEFAULT_TAX_PERCENT,
                    })
                  }
                >
                  <Plus className="size-4" />
                  Agregar línea
                </Button>
              )}
            </form.Field>
          </CardHeader>
          <CardContent className="space-y-4">
            <form.Field name="lines">
              {(field) => (
                <>
                  {field.state.value.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No hay líneas agregadas. Presiona "Agregar línea" para
                      empezar.
                    </p>
                  )}

                  {field.state.value.map((_, index) => {
                    const line = field.state.value[index];
                    const totals = computeLineTotals(line);

                    return (
                      <div
                        key={index}
                        className="space-y-3 rounded-lg border p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                          <form.Field name={`lines[${index}].product`}>
                            {(subField) => (
                              <div className="grid flex-1 gap-1.5">
                                <Label htmlFor={subField.name}>Producto</Label>
                                <ProductCombobox
                                  id={subField.name}
                                  value={subField.state.value}
                                  onChange={(product) => {
                                    subField.handleChange(product);
                                    form.setFieldValue(
                                      `lines[${index}].variant`,
                                      null
                                    );
                                  }}
                                />
                              </div>
                            )}
                          </form.Field>

                          <form.Field
                            name={`lines[${index}].variant`}
                            validators={{
                              onSubmit: ({ value }) => {
                                if (!value) return "Selecciona una variante.";
                                return undefined;
                              },
                            }}
                          >
                            {(subField) => (
                              <div className="grid flex-1 gap-1.5">
                                <Label htmlFor={subField.name}>Variante</Label>
                                <VariantCombobox
                                  id={subField.name}
                                  productId={line.product?.id ?? null}
                                  value={subField.state.value}
                                  onChange={(variant) => {
                                    subField.handleChange(variant);
                                    if (variant) {
                                      form.setFieldValue(
                                        `lines[${index}].description`,
                                        variant.display_name
                                      );
                                      const price =
                                        findActiveRegularPrice(variant);
                                      if (price) {
                                        form.setFieldValue(
                                          `lines[${index}].unit_price`,
                                          centsToPesosString(price.amount)
                                        );
                                      }
                                    }
                                  }}
                                  disabled={!line.product}
                                />
                                {subField.state.meta.errors[0] && (
                                  <p className="text-xs text-destructive">
                                    {subField.state.meta.errors[0]}
                                  </p>
                                )}
                              </div>
                            )}
                          </form.Field>

                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-9 text-destructive"
                              onClick={() => field.removeValue(index)}
                              aria-label="Eliminar línea"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>

                        <form.Field
                          name={`lines[${index}].description`}
                          validators={{
                            onSubmit: ({ value }) =>
                              validateRequired(value, "La descripción", 1),
                          }}
                        >
                          {(subField) => (
                            <div className="grid gap-1.5">
                              <Label htmlFor={subField.name}>Descripción</Label>
                              <Input
                                id={subField.name}
                                value={subField.state.value}
                                onChange={(event) =>
                                  subField.handleChange(event.target.value)
                                }
                                onBlur={subField.handleBlur}
                                placeholder="Descripción del producto"
                                aria-invalid={
                                  subField.state.meta.errors.length > 0
                                }
                              />
                              {subField.state.meta.errors[0] && (
                                <p className="text-xs text-destructive">
                                  {subField.state.meta.errors[0]}
                                </p>
                              )}
                            </div>
                          )}
                        </form.Field>

                        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end sm:gap-3">
                          <form.Field
                            name={`lines[${index}].quantity`}
                            validators={{
                              onSubmit: ({ value }) => validateQuantity(value),
                            }}
                          >
                            {(subField) => (
                              <div className="grid flex-1 gap-1.5 sm:max-w-[6rem]">
                                <Label htmlFor={subField.name}>Cantidad</Label>
                                <Input
                                  id={subField.name}
                                  type="number"
                                  min={1}
                                  step={1}
                                  value={subField.state.value}
                                  onChange={(event) =>
                                    subField.handleChange(event.target.value)
                                  }
                                  onBlur={subField.handleBlur}
                                  aria-invalid={
                                    subField.state.meta.errors.length > 0
                                  }
                                />
                                {subField.state.meta.errors[0] && (
                                  <p className="text-xs text-destructive">
                                    {subField.state.meta.errors[0]}
                                  </p>
                                )}
                              </div>
                            )}
                          </form.Field>

                          <form.Field
                            name={`lines[${index}].unit_price`}
                            validators={{
                              onSubmit: ({ value }) => validateUnitPrice(value),
                            }}
                          >
                            {(subField) => (
                              <div className="grid flex-1 gap-1.5 sm:max-w-[8rem]">
                                <Label htmlFor={subField.name}>
                                  Precio unit.
                                </Label>
                                <Input
                                  id={subField.name}
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={subField.state.value}
                                  onChange={(event) =>
                                    subField.handleChange(event.target.value)
                                  }
                                  onBlur={subField.handleBlur}
                                  aria-invalid={
                                    subField.state.meta.errors.length > 0
                                  }
                                  className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                                {subField.state.meta.errors[0] && (
                                  <p className="text-xs text-destructive">
                                    {subField.state.meta.errors[0]}
                                  </p>
                                )}
                              </div>
                            )}
                          </form.Field>

                          <form.Field
                            name={`lines[${index}].discount_percent`}
                            validators={{
                              onSubmit: ({ value }) =>
                                validatePercent(value, "El descuento"),
                            }}
                          >
                            {(subField) => (
                              <div className="grid flex-1 gap-1.5 sm:max-w-[6rem]">
                                <Label htmlFor={subField.name}>Desc. %</Label>
                                <Input
                                  id={subField.name}
                                  type="number"
                                  min={0}
                                  max={100}
                                  step="0.01"
                                  value={subField.state.value}
                                  onChange={(event) =>
                                    subField.handleChange(event.target.value)
                                  }
                                  onBlur={subField.handleBlur}
                                  aria-invalid={
                                    subField.state.meta.errors.length > 0
                                  }
                                />
                                {subField.state.meta.errors[0] && (
                                  <p className="text-xs text-destructive">
                                    {subField.state.meta.errors[0]}
                                  </p>
                                )}
                              </div>
                            )}
                          </form.Field>

                          <form.Field
                            name={`lines[${index}].tax_rate`}
                            validators={{
                              onSubmit: ({ value }) =>
                                validatePercent(value, "El impuesto"),
                            }}
                          >
                            {(subField) => (
                              <div className="grid flex-1 gap-1.5 sm:max-w-[6rem]">
                                <Label htmlFor={subField.name}>IVA %</Label>
                                <Input
                                  id={subField.name}
                                  type="number"
                                  min={0}
                                  max={100}
                                  step="0.01"
                                  value={subField.state.value}
                                  onChange={(event) =>
                                    subField.handleChange(event.target.value)
                                  }
                                  onBlur={subField.handleBlur}
                                  aria-invalid={
                                    subField.state.meta.errors.length > 0
                                  }
                                />
                                {subField.state.meta.errors[0] && (
                                  <p className="text-xs text-destructive">
                                    {subField.state.meta.errors[0]}
                                  </p>
                                )}
                              </div>
                            )}
                          </form.Field>

                          <div className="col-span-2 flex items-center justify-between gap-2 sm:ml-auto sm:flex-col sm:items-end sm:justify-end">
                            <span className="text-xs text-muted-foreground">
                              Total línea
                            </span>
                            <span className="text-sm font-medium">
                              {currencyFormatter.format(totals.total / 100)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </form.Field>
          </CardContent>
        </Card>
      </fieldset>

      <form.Subscribe selector={(state) => state.values.lines}>
        {(lines) => {
          const { gross, discount, tax, total } = lines.reduce(
            (acc, line) => {
              const totals = computeLineTotals(line);
              return {
                gross: acc.gross + totals.gross,
                discount: acc.discount + totals.discount,
                tax: acc.tax + totals.tax,
                total: acc.total + totals.total,
              };
            },
            { gross: 0, discount: 0, tax: 0, total: 0 }
          );

          return (
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{currencyFormatter.format(gross / 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Descuento</span>
                    <span>{currencyFormatter.format(discount / 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impuestos</span>
                    <span>{currencyFormatter.format(tax / 100)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-base font-semibold">
                    <span>Total</span>
                    <span>{currencyFormatter.format(total / 100)}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    render={<Link to="/sales" />}
                  >
                    {isDetail ? "Regresar" : "Cancelar"}
                  </Button>
                  {!isDetail && (
                    <form.Subscribe selector={(state) => state.isSubmitting}>
                      {(isSubmitting) => (
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Creando..." : "Crear orden"}
                        </Button>
                      )}
                    </form.Subscribe>
                  )}
                  {isDetail && editable && (
                    <form.Subscribe
                      selector={(state) => [state.isSubmitting, state.isDirty]}
                    >
                      {([isSubmitting, isDirty]) => (
                        <Button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => {
                            if (!isDirty) {
                              toast.info("No hay cambios por guardar");
                              return;
                            }
                            void form.handleSubmit();
                          }}
                        >
                          {isSubmitting ? "Guardando..." : "Guardar cambios"}
                        </Button>
                      )}
                    </form.Subscribe>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        }}
      </form.Subscribe>

      {isReadOnlyOrder && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" size="lg" className="h-12 font-semibold">
            Despachar
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="lg"
            className="h-12 font-semibold"
          >
            Cancelar pedido
          </Button>
        </div>
      )}
    </form>
  );
}
