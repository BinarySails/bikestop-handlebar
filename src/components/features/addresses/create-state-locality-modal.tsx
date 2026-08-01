import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

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
import { createLocalityRequest, useCreateStateRequest } from "@/lib/api/api";
import {
  CreateLocalityRequestBody,
  CreateStateRequestBody,
} from "@/lib/api/zods";

function validateDisplayName(value: string) {
  const displayName = value.trim();

  if (!displayName) return "El nombre es obligatorio";
  if (displayName.length < 3) {
    return "El nombre debe tener al menos 3 caracteres";
  }

  return undefined;
}

function getErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;

  const error = data as { content?: unknown; message?: unknown };

  if (typeof error.message === "string" && error.message.trim()) {
    const translations: Record<string, string> = {
      "could not save locality": "No se pudo guardar la localidad",
      "could not save state": "No se pudo guardar el estado",
      "error while validating": fallback,
      "locality already exists in this state":
        "La localidad ya existe dentro de este estado",
      "state not found": "No se encontró el estado",
    };

    return translations[error.message.toLowerCase()] ?? error.message;
  }

  if (typeof error.content === "string" && error.content.trim()) {
    return error.content;
  }

  return fallback;
}

type ServerErrors = {
  locality?: string;
  state?: string;
};

export function CreateStateLocalityDialog() {
  const [open, setOpen] = useState(false);
  const [createdStateId, setCreatedStateId] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<ServerErrors>({});
  const { trigger: createState } = useCreateStateRequest();

  const form = useForm({
    defaultValues: {
      stateDisplayName: "",
      localityDisplayName: "",
    },
    onSubmit: async ({ value }) => {
      setServerErrors({});

      let stateId = createdStateId;

      if (!stateId) {
        try {
          const stateResponse = await createState({
            display_name: value.stateDisplayName.trim(),
          });
          const stateStatus = Number(stateResponse.status);

          if (stateStatus !== 200 && stateStatus !== 201) {
            const fallback =
              stateResponse.status === 400
                ? "El nombre del estado no es válido"
                : "No se pudo guardar el estado";
            const message = getErrorMessage(stateResponse.data, fallback);

            if (stateResponse.status === 400) {
              setServerErrors({ state: message });
            }

            toast.error(message);
            return;
          }

          stateId = (stateResponse.data as { id: string }).id;
          setCreatedStateId(stateId);
        } catch {
          toast.error("No se pudo conectar al servidor al guardar el estado");
          return;
        }
      }

      try {
        const localityResponse = await createLocalityRequest(stateId, {
          display_name: value.localityDisplayName.trim(),
        });

        if (localityResponse.status !== 201) {
          const fallback =
            localityResponse.status === 400
              ? "El nombre de la localidad no es válido"
              : localityResponse.status === 404
                ? "No se encontró el estado"
                : localityResponse.status === 409
                  ? "La localidad ya existe dentro de este estado"
                  : "No se pudo guardar la localidad";
          const message = getErrorMessage(localityResponse.data, fallback);

          if (localityResponse.status === 400) {
            setServerErrors({ locality: message });
          }

          toast.error(message);
          return;
        }

        toast.success("El estado y la localidad se crearon correctamente");
        form.reset();
        setCreatedStateId(null);
        setServerErrors({});
        setOpen(false);
      } catch {
        toast.error("No se pudo conectar al servidor al guardar la localidad");
      }
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset();
      setCreatedStateId(null);
      setServerErrors({});
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        Nuevo estado / localidad
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo estado / localidad</DialogTitle>
          <DialogDescription>
            Primero crea el estado y después la localidad que le pertenece.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field
            name="stateDisplayName"
            validators={{
              onChange: ({ value }) => {
                const result =
                  CreateStateRequestBody.shape.display_name.safeParse(value);

                if (!result.success) return result.error.issues[0]?.message;
                return validateDisplayName(value);
              },
              onSubmit: ({ value }) => validateDisplayName(value),
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <div>
                  <p className="font-medium">1. Estado</p>
                  <p className="text-sm text-muted-foreground">
                    Ingresa el estado al que pertenecerá la nueva localidad.
                  </p>
                </div>
                <Label htmlFor={field.name}>Nombre *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    setServerErrors((errors) => ({
                      ...errors,
                      state: undefined,
                    }));
                    field.handleChange(event.target.value);
                  }}
                  placeholder="Jalisco"
                  autoComplete="address-level1"
                  disabled={createdStateId !== null}
                  aria-invalid={
                    serverErrors.state || field.state.meta.errors.length > 0
                      ? "true"
                      : undefined
                  }
                  aria-describedby={
                    serverErrors.state || field.state.meta.errors.length > 0
                      ? `${field.name}-error`
                      : undefined
                  }
                />
                {(serverErrors.state || field.state.meta.errors[0]) && (
                  <p
                    id={`${field.name}-error`}
                    className="text-sm text-destructive"
                  >
                    {serverErrors.state ?? field.state.meta.errors[0]}
                  </p>
                )}
                {createdStateId && (
                  <p className="text-sm text-muted-foreground">
                    Estado creado. El reintento solo creará la localidad.
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="localityDisplayName"
            validators={{
              onChange: ({ value }) => {
                const result =
                  CreateLocalityRequestBody.shape.display_name.safeParse(value);

                if (!result.success) return result.error.issues[0]?.message;
                return validateDisplayName(value);
              },
              onSubmit: ({ value }) => validateDisplayName(value),
            }}
          >
            {(field) => (
              <div className="grid gap-2 border-t pt-5">
                <div>
                  <p className="font-medium">2. Localidad</p>
                  <p className="text-sm text-muted-foreground">
                    Esta localidad se creará dentro del estado anterior.
                  </p>
                </div>
                <Label htmlFor={field.name}>Nombre *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    setServerErrors((errors) => ({
                      ...errors,
                      locality: undefined,
                    }));
                    field.handleChange(event.target.value);
                  }}
                  placeholder="Guadalajara"
                  autoComplete="address-level2"
                  aria-invalid={
                    serverErrors.locality || field.state.meta.errors.length > 0
                      ? "true"
                      : undefined
                  }
                  aria-describedby={
                    serverErrors.locality || field.state.meta.errors.length > 0
                      ? `${field.name}-error`
                      : undefined
                  }
                />
                {(serverErrors.locality || field.state.meta.errors[0]) && (
                  <p
                    id={`${field.name}-error`}
                    className="text-sm text-destructive"
                  >
                    {serverErrors.locality ?? field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? createdStateId
                      ? "Creando localidad..."
                      : "Creando estado y localidad..."
                    : createdStateId
                      ? "Reintentar localidad"
                      : "Crear estado y localidad"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
