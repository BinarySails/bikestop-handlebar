import { useState } from "react";
import { useForm } from "@tanstack/react-form";

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
import type { Brand } from "@/lib/api/schemas";

import { ImageUploadField } from "./image-upload-field";

export type BrandFormValues = {
  display_name: string;
  image_url: string;
};

export type BrandFormErrors = Partial<BrandFormValues> & { form?: string };

type BrandFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: Brand | null;
  onSubmit: (values: BrandFormValues) => Promise<BrandFormErrors | void>;
};

function validateName(value: string): string | undefined {
  if (!value.trim()) return "El nombre es obligatorio.";
  if (value.trim().length < 3)
    return "El nombre debe tener al menos 3 caracteres.";
  return undefined;
}

function validateImageUrl(value: string): string | undefined {
  if (!value.trim()) return "La URL de la imagen es obligatoria.";
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:")
      throw new Error();
  } catch {
    return "Ingresa una URL válida que comience con http:// o https://.";
  }
  return undefined;
}

export function BrandFormDialog({
  open,
  onOpenChange,
  brand,
  onSubmit,
}: BrandFormDialogProps) {
  const [submissionErrors, setSubmissionErrors] = useState<BrandFormErrors>({});
  const [imageUploading, setImageUploading] = useState(false);
  const isEditing = Boolean(brand);
  const form = useForm({
    defaultValues: {
      display_name: brand?.display_name ?? "",
      image_url: brand?.image_url ?? "",
    },
    onSubmit: async ({ value }) => {
      setSubmissionErrors({});
      const errors = await onSubmit({
        display_name: value.display_name.trim(),
        image_url: value.image_url.trim(),
      });
      if (errors && Object.keys(errors).length > 0) {
        setSubmissionErrors(errors);
        return;
      }
      form.reset();
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar marca" : "Crear marca"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza el nombre y la imagen de la marca."
              : "Agrega una marca al catálogo de productos."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field
            name="display_name"
            validators={{
              onBlur: ({ value }) => validateName(value),
              onSubmit: ({ value }) => validateName(value),
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Nombre visible</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={Boolean(
                    field.state.meta.errors[0] || submissionErrors.display_name
                  )}
                  aria-describedby={`${field.name}-error`}
                />
                {(field.state.meta.errors[0] ||
                  submissionErrors.display_name) && (
                  <p
                    id={`${field.name}-error`}
                    className="text-sm text-destructive"
                  >
                    {field.state.meta.errors[0] ||
                      submissionErrors.display_name}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="image_url"
            validators={{
              onBlur: ({ value }) => validateImageUrl(value),
              onSubmit: ({ value }) => validateImageUrl(value),
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <ImageUploadField
                  id={field.name}
                  label="Imagen de la marca"
                  value={field.state.value}
                  onChange={field.handleChange}
                  onUploadingChange={setImageUploading}
                />
                {(field.state.meta.errors[0] || submissionErrors.image_url) && (
                  <p
                    id={`${field.name}-error`}
                    className="text-sm text-destructive"
                  >
                    {field.state.meta.errors[0] || submissionErrors.image_url}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {submissionErrors.form && (
            <p role="alert" className="text-sm text-destructive">
              {submissionErrors.form}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting || imageUploading}>
                  {isSubmitting
                    ? "Guardando..."
                    : isEditing
                      ? "Guardar cambios"
                      : "Crear marca"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
