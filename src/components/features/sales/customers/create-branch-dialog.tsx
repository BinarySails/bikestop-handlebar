import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import { createBranch } from "@/lib/api/customers";
import { useListStatesRequest, useListLocalitiesRequest } from "@/lib/api/api";
import type { State } from "@/lib/api/schemas";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

interface CreateBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  onSuccess: () => void;
}

export function CreateBranchDialog({
  open,
  onOpenChange,
  customerId,
  onSuccess,
}: CreateBranchDialogProps) {
  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [selectedLocalityId, setSelectedLocalityId] = useState<string>("");

  const { data: statesData } = useListStatesRequest();
  const { data: localitiesData } = useListLocalitiesRequest(
    selectedStateId as any,
    { swr: { enabled: !!selectedStateId } }
  );

  const states: State[] =
    statesData?.status === 200 ? (statesData.data as State[]) : [];
  const localities =
    localitiesData?.status === 200
      ? (
          localitiesData.data as {
            data: Array<{ id: string; display_name: string }>;
          }
        ).data
      : [];

  const form = useForm({
    defaultValues: {
      postalCode: "",
      address: "",
      isDefault: false,
    },
    onSubmit: async ({ value }) => {
      if (!selectedStateId || !selectedLocalityId) {
        toast.error("Selecciona estado y localidad.");
        return;
      }
      try {
        await createBranch(customerId, {
          state_id: selectedStateId,
          locality_id: selectedLocalityId,
          postal_code: value.postalCode,
          address: value.address,
          is_default: value.isDefault,
        });
        toast.success("Sucursal creada.");
        form.reset();
        setSelectedStateId("");
        setSelectedLocalityId("");
        onSuccess();
      } catch {
        toast.error("Error al crear la sucursal.");
      }
    },
  });

  function handleStateChange(value: string | null) {
    setSelectedStateId(value ?? "");
    setSelectedLocalityId("");
  }

  function handleLocalityChange(value: string | null) {
    setSelectedLocalityId(value ?? "");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Crear Sucursal</DialogTitle>
          <DialogDescription>
            Ingresa la información de la nueva sucursal.
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
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select value={selectedStateId} onValueChange={handleStateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.id}>
                      {state.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Localidad</Label>
              <Select
                value={selectedLocalityId}
                onValueChange={handleLocalityChange}
                disabled={!selectedStateId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar localidad" />
                </SelectTrigger>
                <SelectContent>
                  {localities.map((locality) => (
                    <SelectItem key={locality.id} value={locality.id}>
                      {locality.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <form.Field
            name="postalCode"
            validators={{
              onChange: ({ value }) => {
                if (!value.trim()) return "El código postal es requerido";
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Código Postal</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="44100"
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
            name="address"
            validators={{
              onChange: ({ value }) => {
                if (!value.trim()) return "La dirección es requerida";
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Dirección</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Av. Principal 123"
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

          <form.Field name="isDefault">
            {(field) => (
              <div className="flex items-center gap-2">
                <Label htmlFor="is-default">Sucursal predeterminada</Label>
                <button
                  type="button"
                  id="is-default"
                  aria-label="Sucursal predeterminada"
                  onClick={() => field.handleChange(!field.state.value)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    field.state.value ? "bg-primary" : "bg-input"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                      field.state.value ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            )}
          </form.Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>

            <form.Subscribe selector={(state) => [state.isSubmitting]}>
              {([isSubmitting]) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Crear Sucursal"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
