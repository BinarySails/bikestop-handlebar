import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { useCreateWarehouseRequest, useListStatesRequest } from "@/lib/api/api";
import { CreateWarehouseRequestBody } from "@/lib/api/zods";

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

const DEFAULT_COUNTRY = "México";

const requiredMessage = (label: string, value: string) => {
  return value.trim() ? undefined : `El ${label} es requerido`;
};

export function CreateWarehouseDialog() {
  const [open, setOpen] = useState(false);
  const { trigger } = useCreateWarehouseRequest();
  const { data: statesResponse, isLoading: isLoadingStates } =
    useListStatesRequest();

  const states =
    statesResponse?.status === 200 ? (statesResponse.data ?? []) : [];

  const form = useForm({
    defaultValues: {
      code: "",
      name: "",
      description: "",
      address: {
        country: DEFAULT_COUNTRY,
        state: "",
        city: "",
        postal_code: "",
        address: "",
      },
    },
    onSubmit: async ({ value }) => {
      const result = await trigger({
        code: value.code || null,
        name: value.name,
        description: value.description || null,
        address: value.address,
      });

      const errorData =
        "data" in result
          ? (result as { data: { message?: string } }).data
          : null;

      if (result.status === 201) {
        toast.success(`Almacén "${value.name}" creado correctamente`);
        form.reset();
        setOpen(false);
      } else {
        toast.error(errorData?.message ?? "No se pudo crear el almacén");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>Crear Almacén</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear almacén</DialogTitle>
          <DialogDescription>
            Ingresa la información para el nuevo almacén.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="code"
            validators={{
              onChange: ({ value }) => {
                const result = CreateWarehouseRequestBody.shape.code.safeParse(
                  value || null
                );
                return result.success
                  ? undefined
                  : result.error.issues[0].message;
              },
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Código</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="WH-QRO-001"
                  aria-invalid={
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                      ? "true"
                      : undefined
                  }
                />
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-red-500">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) => requiredMessage("Nombre", value),
              onSubmit: ({ value }) => requiredMessage("Nombre", value),
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Nombre</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Almacén principal"
                  aria-invalid={
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                      ? "true"
                      : undefined
                  }
                />
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-red-500">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="description"
            validators={{
              onChange: ({ value }) => {
                const result =
                  CreateWarehouseRequestBody.shape.description.safeParse(
                    value || null
                  );
                return result.success
                  ? undefined
                  : result.error.issues[0].message;
              },
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Descripción</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Descripción opcional"
                />
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-red-500">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <div className="space-y-2">
            <Label>Dirección</Label>
            <div className="grid gap-4 rounded-lg border p-4">
              <form.Field
                name="address.country"
                validators={{
                  onChange: ({ value }) => requiredMessage("País", value),
                  onSubmit: ({ value }) => requiredMessage("País", value),
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
                      <SelectTrigger
                        id={field.name}
                        className="w-full"
                        aria-invalid={
                          field.state.meta.isTouched &&
                          field.state.meta.errors.length > 0
                            ? "true"
                            : undefined
                        }
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DEFAULT_COUNTRY}>
                          {DEFAULT_COUNTRY}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-red-500">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="address.state"
                validators={{
                  onChange: ({ value }) => requiredMessage("Estado", value),
                  onSubmit: ({ value }) => requiredMessage("Estado", value),
                }}
              >
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Estado</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => {
                        if (value) field.handleChange(value);
                      }}
                      disabled={isLoadingStates}
                    >
                      <SelectTrigger
                        id={field.name}
                        className="w-full"
                        aria-invalid={
                          field.state.meta.isTouched &&
                          field.state.meta.errors.length > 0
                            ? "true"
                            : undefined
                        }
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
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-red-500">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="address.city"
                validators={{
                  onChange: ({ value }) => requiredMessage("Ciudad", value),
                  onSubmit: ({ value }) => requiredMessage("Ciudad", value),
                }}
              >
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Ciudad</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Querétaro"
                      aria-invalid={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                          ? "true"
                          : undefined
                      }
                    />
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-red-500">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="address.postal_code"
                validators={{
                  onChange: ({ value }) =>
                    requiredMessage("Código postal", value),
                  onSubmit: ({ value }) =>
                    requiredMessage("Código postal", value),
                }}
              >
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Código postal</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="76000"
                      aria-invalid={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                          ? "true"
                          : undefined
                      }
                    />
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-red-500">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="address.address"
                validators={{
                  onChange: ({ value }) =>
                    requiredMessage("Calle y número", value),
                  onSubmit: ({ value }) =>
                    requiredMessage("Calle y número", value),
                }}
              >
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Calle y número</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Av. Constituyentes 1234"
                      aria-invalid={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                          ? "true"
                          : undefined
                      }
                    />
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-red-500">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>

            <form.Subscribe selector={(state) => [state.isSubmitting]}>
              {([isSubmitting]) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creando..." : "Crear Almacén"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
