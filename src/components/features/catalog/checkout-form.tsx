import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";

import {
  CountrySelect,
  DEFAULT_COUNTRY,
} from "@/components/features/locations/country-select";
import { StateSelect } from "@/components/features/locations/state-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/lib/auth/use-auth-store";
import {
  useListCustomerAddressesRequest,
  useMeHandler,
} from "@/lib/api/api";
import type { CustomerAddressWithAddressRow } from "@/lib/api/schemas";
import { useCheckoutCart } from "@/lib/cart/use-cart";

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
  shipping_address: addressSnapshotSchema,
});

type AddressFormValues = {
  country: string;
  state: string;
  city: string;
  postal_code: string;
  address: string;
};

type CheckoutFormValues = {
  billing: AddressFormValues;
  shipping_same_as_billing: boolean;
  shipping: AddressFormValues;
  comments: string;
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

const emptyAddress: AddressFormValues = {
  country: DEFAULT_COUNTRY,
  state: "",
  city: "",
  postal_code: "",
  address: "",
};

function formatAddressRow(addr: CustomerAddressWithAddressRow) {
  return `${addr.street_address}, ${addr.city}, ${addr.state}, ${addr.postal_code}, ${addr.country}`;
}

function addressToFormValues(
  addr: CustomerAddressWithAddressRow
): AddressFormValues {
  return {
    country: addr.country,
    state: addr.state,
    city: addr.city,
    postal_code: addr.postal_code,
    address: addr.street_address,
  };
}

function CheckoutForm({ onDone }: { onDone?: () => void }) {
  const navigate = useNavigate();
  const { trigger: checkoutCart, isMutating } = useCheckoutCart();

  const actor = useAuthStore((state) => state.actor);
  const { data: meRes } = useMeHandler();
  const userId = actor?.id ?? (meRes?.status === 200 ? meRes.data.id : "");

  const { data: addressesRes } = useListCustomerAddressesRequest(userId, {
    swr: { enabled: Boolean(userId) },
  });

  const allAddresses =
    addressesRes?.status === 200 ? (addressesRes.data ?? []) : [];
  const addresses = allAddresses.filter((a) => a.status === "enable");

  const defaultBilling = addresses.find((a) => a.is_default_billing);
  const defaultShipping = addresses.find((a) => a.is_default_shipping);

  const [selectedBillingId, setSelectedBillingId] = useState<
    string | "new"
  >(defaultBilling ? defaultBilling.id : "new");
  const [selectedShippingId, setSelectedShippingId] = useState<
    string | "new"
  >(defaultShipping ? defaultShipping.id : "new");

  const selectedBillingAddr =
    selectedBillingId !== "new"
      ? addresses.find((a) => a.id === selectedBillingId) ?? null
      : null;
  const selectedShippingAddr =
    selectedShippingId !== "new"
      ? addresses.find((a) => a.id === selectedShippingId) ?? null
      : null;

  const form = useForm({
    defaultValues: {
      billing: selectedBillingAddr
        ? addressToFormValues(selectedBillingAddr)
        : emptyAddress,
      shipping_same_as_billing: true,
      shipping: selectedShippingAddr
        ? addressToFormValues(selectedShippingAddr)
        : emptyAddress,
      comments: "",
    } satisfies CheckoutFormValues,
    onSubmit: async ({ value }) => {
      const billingAddress = selectedBillingAddr
        ? {
            country: selectedBillingAddr.country.trim(),
            state: selectedBillingAddr.state.trim(),
            city: selectedBillingAddr.city.trim(),
            postal_code: selectedBillingAddr.postal_code.trim(),
            address: selectedBillingAddr.street_address.trim(),
          }
        : {
            country: value.billing.country.trim(),
            state: value.billing.state.trim(),
            city: value.billing.city.trim(),
            postal_code: value.billing.postal_code.trim(),
            address: value.billing.address.trim(),
          };

      let shippingAddress: {
        country: string;
        state: string;
        city: string;
        postal_code: string;
        address: string;
      };

      if (value.shipping_same_as_billing) {
        shippingAddress = billingAddress;
      } else if (selectedShippingAddr) {
        shippingAddress = {
          country: selectedShippingAddr.country.trim(),
          state: selectedShippingAddr.state.trim(),
          city: selectedShippingAddr.city.trim(),
          postal_code: selectedShippingAddr.postal_code.trim(),
          address: selectedShippingAddr.street_address.trim(),
        };
      } else {
        shippingAddress = {
          country: value.shipping.country.trim(),
          state: value.shipping.state.trim(),
          city: value.shipping.city.trim(),
          postal_code: value.shipping.postal_code.trim(),
          address: value.shipping.address.trim(),
        };
      }

      const payload = {
        billing_address: billingAddress,
        shipping_address: shippingAddress,
        comments: value.comments.trim() || null,
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
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dirección de facturación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {addresses.length > 0 && (
              <div className="grid gap-1.5">
                <Label>Seleccionar dirección</Label>
                <Select
                  value={selectedBillingId}
                  onValueChange={(v) =>
                    setSelectedBillingId(v as string | "new")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar dirección">
                      {(value) =>
                        value === "new"
                          ? "Ingresar nueva dirección"
                          : addresses.find((a) => a.id === value)
                            ? formatAddressRow(
                                addresses.find((a) => a.id === value)!
                              )
                            : "Seleccionar dirección"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {addresses.map((addr) => (
                      <SelectItem
                        key={addr.id}
                        value={addr.id}
                        label={formatAddressRow(addr)}
                      >
                        {formatAddressRow(addr)}
                        {addr.is_default_billing && (
                          <Badge className="ml-2 text-[10px]">
                            Predeterminada
                          </Badge>
                        )}
                      </SelectItem>
                    ))}
                    <SelectItem value="new" label="Ingresar nueva dirección">
                      Ingresar nueva dirección
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedBillingAddr ? (
              <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>País</Label>
                  <p className="text-sm">{selectedBillingAddr.country}</p>
                </div>
                <div className="grid gap-1.5">
                  <Label>Estado</Label>
                  <p className="text-sm">{selectedBillingAddr.state}</p>
                </div>
                <div className="grid gap-1.5">
                  <Label>Ciudad</Label>
                  <p className="text-sm">{selectedBillingAddr.city}</p>
                </div>
                <div className="grid gap-1.5">
                  <Label>Código postal</Label>
                  <p className="text-sm">{selectedBillingAddr.postal_code}</p>
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label>Dirección</Label>
                  <p className="text-sm">
                    {selectedBillingAddr.street_address}
                  </p>
                </div>
              </div>
            ) : (
              renderAddressFields("billing")
            )}
          </CardContent>
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
                  <>
                    {addresses.length > 0 && (
                      <div className="grid gap-1.5">
                        <Label>Seleccionar dirección</Label>
                        <Select
                          value={selectedShippingId}
                          onValueChange={(v) =>
                            setSelectedShippingId(v as string | "new")
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar dirección">
                              {(value) =>
                                value === "new"
                                  ? "Ingresar nueva dirección"
                                  : addresses.find((a) => a.id === value)
                                    ? formatAddressRow(
                                        addresses.find((a) => a.id === value)!
                                      )
                                    : "Seleccionar dirección"
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {addresses.map((addr) => (
                              <SelectItem
                                key={addr.id}
                                value={addr.id}
                                label={formatAddressRow(addr)}
                              >
                                {formatAddressRow(addr)}
                                {addr.is_default_shipping && (
                                  <Badge className="ml-2 text-[10px]">
                                    Predeterminada
                                  </Badge>
                                )}
                              </SelectItem>
                            ))}
                            <SelectItem value="new" label="Ingresar nueva dirección">
                              Ingresar nueva dirección
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {selectedShippingAddr ? (
                      <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                          <Label>País</Label>
                          <p className="text-sm">
                            {selectedShippingAddr.country}
                          </p>
                        </div>
                        <div className="grid gap-1.5">
                          <Label>Estado</Label>
                          <p className="text-sm">
                            {selectedShippingAddr.state}
                          </p>
                        </div>
                        <div className="grid gap-1.5">
                          <Label>Ciudad</Label>
                          <p className="text-sm">
                            {selectedShippingAddr.city}
                          </p>
                        </div>
                        <div className="grid gap-1.5">
                          <Label>Código postal</Label>
                          <p className="text-sm">
                            {selectedShippingAddr.postal_code}
                          </p>
                        </div>
                        <div className="grid gap-1.5 sm:col-span-2">
                          <Label>Dirección</Label>
                          <p className="text-sm">
                            {selectedShippingAddr.street_address}
                          </p>
                        </div>
                      </div>
                    ) : (
                      renderAddressFields("shipping")
                    )}
                  </>
                )
              }
            </form.Subscribe>
          </CardContent>
        </Card>
      </div>

      <form.Field name="comments">
        {(field) => (
          <div className="grid gap-1.5">
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

      <div className="flex justify-end">
        <Button
          type="submit"
          className="bg-amber-500 text-black hover:bg-amber-600"
          disabled={isMutating}
        >
          {isMutating ? "Confirmando..." : "Confirmar pedido"}
        </Button>
      </div>
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
