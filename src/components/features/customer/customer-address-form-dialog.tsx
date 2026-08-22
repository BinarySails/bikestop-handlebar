import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import { LocalitySelect } from "@/components/features/locations/locality-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  useCreateCustomerAddressRequest,
  useListStatesRequest,
  useUpdateCustomerAddressRequest,
} from "@/lib/api/api";
import type { CustomerAddressWithAddressRow, State } from "@/lib/api/schemas";

const DEFAULT_COUNTRY = "México";
const EMPTY_STATES: State[] = [];

function requiredMessage(label: string, value: string) {
  return value.trim() ? undefined : `El ${label} es obligatorio`;
}

function validatePhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "El teléfono es obligatorio";
  if (trimmed.length < 10 || trimmed.length > 15) {
    return "El teléfono debe tener entre 10 y 15 dígitos";
  }
  return undefined;
}

function getErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;

  const error = data as { message?: unknown };
  if (typeof error.message !== "string" || !error.message.trim())
    return fallback;

  const translations: Record<string, string> = {
    "customer not found": "No se encontró tu perfil de cliente",
    "address not found": "No se encontró la dirección",
    "state not found": "El estado seleccionado no existe",
    "city not found": "La ciudad seleccionada no existe",
    "error while validating": fallback,
    "input validation error.": fallback,
  };

  return translations[error.message.toLowerCase()] ?? error.message;
}

type FormValues = {
  contact_name: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  postal_code: string;
  address: string;
};

type CustomerAddressFormDialogProps = {
  userId: string;
  mode: "create" | "edit";
  address?: CustomerAddressWithAddressRow;
  trigger: React.ReactElement;
  onSuccess?: () => void;
};

export function CustomerAddressFormDialog({
  userId,
  mode,
  address,
  trigger,
  onSuccess,
}: CustomerAddressFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: statesResponse, isLoading: isLoadingStates } =
    useListStatesRequest();
  const states =
    statesResponse?.status === 200
      ? (statesResponse.data ?? EMPTY_STATES)
      : EMPTY_STATES;
  const statesReady = statesResponse?.status === 200;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Agregar dirección" : "Editar dirección"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Registra una nueva dirección de envío o facturación."
              : "Actualiza los datos de esta dirección."}
          </DialogDescription>
        </DialogHeader>

        {mode === "create" || statesReady ? (
          <CustomerAddressForm
            userId={userId}
            mode={mode}
            address={address}
            states={states}
            isLoadingStates={isLoadingStates}
            onDone={() => {
              setOpen(false);
              onSuccess?.();
            }}
            onCancel={() => setOpen(false)}
          />
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Cargando estados...
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CustomerAddressForm({
  userId,
  mode,
  address,
  states,
  isLoadingStates,
  onDone,
  onCancel,
}: {
  userId: string;
  mode: "create" | "edit";
  address?: CustomerAddressWithAddressRow;
  states: State[];
  isLoadingStates: boolean;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { trigger: createAddress } = useCreateCustomerAddressRequest(userId);
  const { trigger: updateAddress } = useUpdateCustomerAddressRequest(
    userId,
    address?.id ?? ""
  );

  const [selectedState, setSelectedState] = useState<State | null>(
    () => states.find((state) => state.display_name === address?.state) ?? null
  );

  const form = useForm({
    defaultValues: {
      contact_name: address?.contact_name ?? "",
      phone: address?.phone ?? "",
      country: address?.country ?? DEFAULT_COUNTRY,
      state: address?.state ?? "",
      city: address?.city ?? "",
      postal_code: address?.postal_code ?? "",
      address: address?.street_address ?? "",
    } satisfies FormValues,
    onSubmit: async ({ value }) => {
      const payload = {
        contact_name: value.contact_name.trim(),
        phone: value.phone.trim(),
        country: value.country.trim(),
        state: value.state.trim(),
        city: value.city.trim(),
        postal_code: value.postal_code.trim(),
        address: value.address.trim(),
      };

      const result =
        mode === "create"
          ? await createAddress(payload)
          : await updateAddress(payload);

      const status = Number(result.status);
      if (status === 201 || status === 200) {
        toast.success(
          mode === "create" ? "Dirección agregada" : "Dirección actualizada"
        );
        onDone();
        return;
      }

      const fallback =
        mode === "create"
          ? "No se pudo agregar la dirección"
          : "No se pudo actualizar la dirección";
      toast.error(getErrorMessage(result.data, fallback));
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="contact_name"
        validators={{
          onChange: ({ value }) => requiredMessage("nombre de contacto", value),
          onSubmit: ({ value }) => requiredMessage("nombre de contacto", value),
        }}
      >
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Nombre de contacto</Label>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Juan Pérez"
              aria-invalid={Boolean(field.state.meta.errors[0])}
            />
            {field.state.meta.errors[0] && (
              <p className="text-sm text-destructive">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field
        name="phone"
        validators={{
          onBlur: ({ value }) => validatePhone(value),
          onSubmit: ({ value }) => validatePhone(value),
        }}
      >
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Teléfono</Label>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Ej. 5512345678"
              aria-invalid={Boolean(field.state.meta.errors[0])}
            />
            {field.state.meta.errors[0] && (
              <p className="text-sm text-destructive">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <div className="grid gap-4 rounded-lg border p-4">
        <form.Field
          name="country"
          validators={{
            onChange: ({ value }) => requiredMessage("país", value),
            onSubmit: ({ value }) => requiredMessage("país", value),
          }}
        >
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>País</Label>
              <Select
                value={field.state.value}
                onValueChange={(value) => {
                  if (value) field.handleChange(value);
                }}
              >
                <SelectTrigger id={field.name} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DEFAULT_COUNTRY}>
                    {DEFAULT_COUNTRY}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        <form.Field
          name="state"
          validators={{
            onChange: ({ value }) => requiredMessage("estado", value),
            onSubmit: ({ value }) => requiredMessage("estado", value),
          }}
        >
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Estado</Label>
              <Select
                value={field.state.value || null}
                onValueChange={(value) => {
                  if (!value) return;
                  field.handleChange(value);
                  setSelectedState(
                    states.find((state) => state.display_name === value) ?? null
                  );
                  form.setFieldValue("city", "");
                }}
                disabled={isLoadingStates}
              >
                <SelectTrigger
                  id={field.name}
                  className="w-full"
                  aria-invalid={Boolean(field.state.meta.errors[0])}
                >
                  <SelectValue
                    placeholder={
                      isLoadingStates
                        ? "Cargando estados..."
                        : "Selecciona un estado"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.display_name}>
                      {state.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.state.meta.errors[0] && (
                <p className="text-sm text-destructive">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field
          name="city"
          validators={{
            onChange: ({ value }) => requiredMessage("ciudad", value),
            onSubmit: ({ value }) => requiredMessage("ciudad", value),
          }}
        >
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Ciudad</Label>
              <LocalitySelect
                id={field.name}
                stateId={selectedState?.id ?? null}
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value ?? "")}
                aria-invalid={Boolean(field.state.meta.errors[0])}
              />
              {field.state.meta.errors[0] && (
                <p className="text-sm text-destructive">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field
          name="postal_code"
          validators={{
            onChange: ({ value }) => requiredMessage("código postal", value),
            onSubmit: ({ value }) => requiredMessage("código postal", value),
          }}
        >
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Código postal</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="44100"
                aria-invalid={Boolean(field.state.meta.errors[0])}
              />
              {field.state.meta.errors[0] && (
                <p className="text-sm text-destructive">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field
          name="address"
          validators={{
            onChange: ({ value }) => requiredMessage("calle y número", value),
            onSubmit: ({ value }) => requiredMessage("calle y número", value),
          }}
        >
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Calle y número</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Av. Vallarta 1234"
                aria-invalid={Boolean(field.state.meta.errors[0])}
              />
              {field.state.meta.errors[0] && (
                <p className="text-sm text-destructive">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : mode === "create"
                  ? "Agregar dirección"
                  : "Guardar cambios"}
            </Button>
          )}
        </form.Subscribe>
      </DialogFooter>
    </form>
  );
}
