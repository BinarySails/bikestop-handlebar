import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import { EntityCreateButton } from "@/components/features/entity/entity-create-button";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
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
  createLocalityRequest,
  useCreateStateRequest,
  useListStatesRequest,
} from "@/lib/api/api";
import type { State } from "@/lib/api/schemas";
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

type CreateStateLocalityDialogProps = {
  onSuccess?: (stateId: string) => void;
};

type StateMode = "existing" | "new";

const EMPTY_STATES: State[] = [];

export function CreateStateLocalityDialog({
  onSuccess,
}: CreateStateLocalityDialogProps) {
  const [open, setOpen] = useState(false);
  const [stateMode, setStateMode] = useState<StateMode>("existing");
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [createdStateId, setCreatedStateId] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<ServerErrors>({});
  const { trigger: createState } = useCreateStateRequest();
  const { data: statesResponse, isLoading: isLoadingStates } =
    useListStatesRequest();
  const states =
    statesResponse?.status === 200
      ? (statesResponse.data ?? EMPTY_STATES)
      : EMPTY_STATES;

  const form = useForm({
    defaultValues: {
      stateDisplayName: "",
      localityDisplayName: "",
    },
    onSubmit: async ({ value }) => {
      setServerErrors({});

      let stateId =
        stateMode === "existing" ? selectedState?.id : createdStateId;

      if (stateMode === "existing" && !stateId) {
        setServerErrors({ state: "Selecciona un estado" });
        return;
      }

      if (stateMode === "new" && !stateId) {
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

      if (!stateId) {
        toast.error("No se pudo determinar el estado de la localidad");
        return;
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

        toast.success(
          stateMode === "existing"
            ? "La localidad se creó correctamente"
            : "El estado y la localidad se crearon correctamente"
        );
        form.reset();
        setStateMode("existing");
        setSelectedState(null);
        setCreatedStateId(null);
        setServerErrors({});
        setOpen(false);
        onSuccess?.(stateId);
      } catch {
        toast.error("No se pudo conectar al servidor al guardar la localidad");
      }
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset();
      setStateMode("existing");
      setSelectedState(null);
      setCreatedStateId(null);
      setServerErrors({});
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <EntityCreateButton>Nuevo estado / localidad</EntityCreateButton>
        }
      />

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo estado / localidad</DialogTitle>
          <DialogDescription>
            Selecciona un estado existente o crea uno nuevo para registrar la
            localidad.
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
                if (stateMode === "existing") return undefined;
                const result =
                  CreateStateRequestBody.shape.display_name.safeParse(value);

                if (!result.success) return result.error.issues[0]?.message;
                return validateDisplayName(value);
              },
              onSubmit: ({ value }) =>
                stateMode === "existing"
                  ? undefined
                  : validateDisplayName(value),
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <div>
                  <p className="font-medium">1. Estado</p>
                  <p className="text-sm text-muted-foreground">
                    Selecciona el estado al que pertenecerá la localidad.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={stateMode === "existing" ? "default" : "outline"}
                    aria-pressed={stateMode === "existing"}
                    disabled={createdStateId !== null}
                    onClick={() => {
                      setStateMode("existing");
                      setServerErrors({});
                    }}
                  >
                    Estado existente
                  </Button>
                  <Button
                    type="button"
                    variant={stateMode === "new" ? "default" : "outline"}
                    aria-pressed={stateMode === "new"}
                    disabled={createdStateId !== null}
                    onClick={() => {
                      setStateMode("new");
                      setServerErrors({});
                    }}
                  >
                    Crear estado nuevo
                  </Button>
                </div>
                {stateMode === "existing" ? (
                  <>
                    <Label htmlFor="existing-state">Estado *</Label>
                    <Combobox
                      items={states}
                      value={selectedState}
                      onValueChange={(state: State | null) => {
                        setSelectedState(state);
                        setServerErrors((errors) => ({
                          ...errors,
                          state: undefined,
                        }));
                      }}
                      itemToStringLabel={(state: State) => state.display_name}
                      itemToStringValue={(state: State) => state.id}
                      isItemEqualToValue={(a: State, b: State) => a.id === b.id}
                      disabled={isLoadingStates}
                    >
                      <ComboboxInput
                        id="existing-state"
                        placeholder={
                          isLoadingStates
                            ? "Cargando estados..."
                            : "Buscar estado"
                        }
                        showClear
                        className="w-full"
                        aria-invalid={serverErrors.state ? true : undefined}
                        aria-describedby={
                          serverErrors.state
                            ? "state-selection-error"
                            : undefined
                        }
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>
                          {statesResponse?.status !== undefined &&
                          statesResponse.status !== 200
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
                  </>
                ) : (
                  <>
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
                  </>
                )}
                {(serverErrors.state ||
                  (stateMode === "new" && field.state.meta.errors[0])) && (
                  <p
                    id={
                      stateMode === "existing"
                        ? "state-selection-error"
                        : `${field.name}-error`
                    }
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
                      : stateMode === "existing"
                        ? "Creando localidad..."
                        : "Creando estado y localidad..."
                    : createdStateId
                      ? "Reintentar localidad"
                      : stateMode === "existing"
                        ? "Crear localidad"
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
