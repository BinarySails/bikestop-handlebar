import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import { createTagRequest, updateTagRequest } from "@/lib/api/api";
import type { OrderTag } from "@/lib/api/schemas";

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

const PRESET_COLORS = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#6B7280",
];

interface CreateSaleOrderTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: OrderTag;
  onSuccess: () => void;
}

export function CreateSaleOrderTagDialog({
  open,
  onOpenChange,
  tag,
  onSuccess,
}: CreateSaleOrderTagDialogProps) {
  const [selectedColor, setSelectedColor] = useState<string>(
    tag?.color ?? PRESET_COLORS[0]
  );

  const form = useForm({
    defaultValues: {
      displayName: tag?.display_name ?? "",
      isActive: tag ? tag.status === "enable" : true,
    },
    onSubmit: async ({ value }) => {
      const slug = value.displayName.toLowerCase().replace(/\s+/g, "-");

      if (tag) {
        try {
          const result = await updateTagRequest(tag.id, {
            display_name: value.displayName,
            slug,
            color: selectedColor || null,
            status: value.isActive ? "enable" : "disable",
          });
          if (result.status !== 200) throw result;
          toast.success(`Etiqueta "${value.displayName}" actualizada.`);
          form.reset();
          onSuccess();
        } catch {
          toast.error("Error al actualizar la etiqueta.");
        }
      } else {
        try {
          const result = await createTagRequest({
            display_name: value.displayName,
            slug,
            color: selectedColor || null,
          });
          if (result.status !== 201) throw result;
          toast.success(`Etiqueta "${value.displayName}" creada.`);
          form.reset();
          onSuccess();
        } catch {
          toast.error("Error al crear la etiqueta.");
        }
      }
    },
  });

  return (
    <Dialog key={tag?.id ?? "create"} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>
            {tag ? "Editar Etiqueta" : "Crear Etiqueta"}
          </DialogTitle>
          <DialogDescription>
            {tag
              ? "Actualiza la información de la etiqueta."
              : "Ingresa la información de la nueva etiqueta."}
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
            name="displayName"
            validators={{
              onChange: ({ value }) => {
                if (!value.trim()) return "El nombre es requerido";
                if (value.trim().length < 3) return "Mínimo 3 caracteres";
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Nombre de la Etiqueta</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Urgente"
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

          <form.Subscribe selector={(state) => [state.values.displayName]}>
            {([displayName]) => (
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={displayName.toLowerCase().replace(/\s+/g, "-")}
                  disabled
                />
              </div>
            )}
          </form.Subscribe>

          <div className="grid gap-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`size-8 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? "scale-110 border-primary"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  aria-label={`Seleccionar color ${color}`}
                />
              ))}
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="size-8 cursor-pointer p-0"
                />
                <Input
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  placeholder="#000000"
                  className="w-24 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {tag && (
            <form.Field name="isActive">
              {(field) => (
                <div className="flex items-center gap-2">
                  <Label htmlFor="is-active">Activo</Label>
                  <button
                    type="button"
                    id="is-active"
                    aria-label="Activo"
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
          )}

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
                  {isSubmitting
                    ? "Guardando..."
                    : tag
                      ? "Guardar Cambios"
                      : "Crear Etiqueta"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
