import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";

import { CustomerCombobox } from "@/components/features/sales/customer-combobox";
import { PaymentTermSelect } from "@/components/features/sales/payment-term-select";
import { OrderTagsSelect } from "@/components/features/sales/tags/order-tags-select";
import {
  CountrySelect,
  DEFAULT_COUNTRY,
} from "@/components/features/locations/country-select";
import { StateSelect } from "@/components/features/locations/state-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  OrderTagId,
  PaginatedCustomerSummaryDataItem,
  PaymentTerm,
} from "@/lib/api/schemas";
import { useCheckoutCart } from "@/lib/cart/use-cart";
import { computeDueDate, formatDueDate } from "@/lib/dates";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const lenientUuid = z.string().regex(UUID_REGEX, "Invalid UUID");

const addressSnapshotSchema = z.object({
  address: z.string(),
  city: z.string(),
  country: z.string(),
  postal_code: z.string(),
  state: z.string(),
});

const CheckoutPayloadSchema = z.object({
  billing_address: addressSnapshotSchema,
  comments: z.string().nullish(),
  customer_id: lenientUuid,
  order_date: z.iso.datetime({ offset: true }),
  payment_term_id: z.union([z.null(), lenientUuid]).optional(),
  shipping_address: addressSnapshotSchema,
  tag_ids: z.array(lenientUuid).nullish(),
});

type AddressFormValues = {
  country: string;
  state: string;
  city: string;
  postal_code: string;
  address: string;
};

type CheckoutFormValues = {
  customer: PaginatedCustomerSummaryDataItem | null;
  billing: AddressFormValues;
  shipping_same_as_billing: boolean;
  shipping: AddressFormValues;
  order_date: Date;
  payment_term: PaymentTerm | null;
  comments: string;
  tag_ids: OrderTagId[];
};

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

const defaultAddress: AddressFormValues = {
  country: DEFAULT_COUNTRY,
  state: "",
  city: "",
  postal_code: "",
  address: "",
};

const defaultValues: CheckoutFormValues = {
  customer: null,
  billing: defaultAddress,
  shipping_same_as_billing: true,
  shipping: defaultAddress,
  order_date: new Date(),
  payment_term: null,
  comments: "",
  tag_ids: [],
};

function PaymentTermField({
  fieldName,
  value: selected,
  onChange,
  orderDate,
}: {
  fieldName: string;
  value: PaymentTerm | null;
  onChange: (next: PaymentTerm | null) => void;
  orderDate: Date;
}) {
  const dueDate = selected
    ? computeDueDate(orderDate.toISOString(), selected.days_until_due ?? null)
    : null;

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={fieldName}>Término de pago</Label>
      <PaymentTermSelect id={fieldName} value={selected} onChange={onChange} />
      {selected && dueDate ? (
        <p className="text-xs text-muted-foreground">
          Vence el {formatDueDate(dueDate)}
        </p>
      ) : selected?.type === "due_on_receipt" ? (
        <p className="text-xs text-muted-foreground">
          Vencimiento inmediato al recibir la factura.
        </p>
      ) : null}
    </div>
  );
}

function CheckoutForm({ onDone }: { onDone?: () => void }) {
  const navigate = useNavigate();
  const { trigger: checkoutCart, isMutating } = useCheckoutCart();

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      if (!value.customer) {
        toast.error("Selecciona un cliente.");
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
        payment_term_id: value.payment_term?.id,
        comments: value.comments.trim() || null,
        tag_ids: value.tag_ids.length > 0 ? value.tag_ids : null,
      };

      const parseResult = await CheckoutPayloadSchema.safeParseAsync(payload);
      if (!parseResult.success) {
        toast.error(parseResult.error.issues[0]?.message ?? "Datos inválidos.");
        return;
      }

      try {
        const result = await checkoutCart(parseResult.data);

        if (result.status === 201) {
          toast.success(`Orden ${result.data.order_number} creada.`);
          onDone?.();
          navigate({ to: "/" });
        } else if (result.status === 404) {
          toast.error("No hay carrito activo.");
          onDone?.();
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
              <CountrySelect
                id={field.name}
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value ?? "")}
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
              <StateSelect
                id={field.name}
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value ?? "")}
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

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la orden</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <form.Field name="order_date">
            {(field) => (
              <Label className="grid items-start gap-1.5">
                <span>Fecha de orden</span>
                <DatePicker
                  value={field.state.value}
                  onChange={(date) => field.handleChange(date ?? new Date())}
                  placeholder="Seleccionar fecha"
                />
              </Label>
            )}
          </form.Field>

          <form.Field name="payment_term">
            {(field) => (
              <PaymentTermField
                fieldName={field.name}
                value={field.state.value}
                onChange={(next) => field.handleChange(next)}
                orderDate={form.state.values.order_date}
              />
            )}
          </form.Field>

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

          <form.Field name="tag_ids">
            {(field) => (
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="checkout-tags">Etiquetas</Label>
                <OrderTagsSelect
                  id="checkout-tags"
                  value={field.state.value}
                  onChange={field.handleChange}
                  placeholder="Seleccionar etiquetas"
                  activeOnly
                />
              </div>
            )}
          </form.Field>

          <div className="flex justify-end gap-3 sm:col-span-2">
            <Button
              type="submit"
              className="bg-amber-500 text-black hover:bg-amber-600"
              disabled={isMutating}
            >
              {isMutating ? "Confirmando..." : "Confirmar pedido"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

export function CheckoutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [openCount, setOpenCount] = useState(0);

  useEffect(() => {
    if (open) setOpenCount((count) => count + 1);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Completar pedido</DialogTitle>
          <DialogDescription>
            Confirma los datos de facturación y envío para crear tu orden de
            venta.
          </DialogDescription>
        </DialogHeader>
        <CheckoutForm key={openCount} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
