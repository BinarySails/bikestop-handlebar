import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import {
  useCreatePermissionHandler,
  useUpdatePermissionHandler,
} from "@/lib/api/api";
import type { Permission } from "@/lib/api/schemas";

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

interface CreatePermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission?: Permission;
  onSuccess: () => void;
}

export function CreatePermissionDialog({
  open,
  onOpenChange,
  permission,
  onSuccess,
}: CreatePermissionDialogProps) {
  const { trigger: createTrigger, isMutating: isCreating } =
    useCreatePermissionHandler();
  const { trigger: updateTrigger, isMutating: isUpdating } =
    useUpdatePermissionHandler(permission?.id ?? "");

  const form = useForm({
    defaultValues: {
      displayName: permission?.display_name ?? "",
      description: permission?.description ?? "",
    },
    onSubmit: async ({ value }) => {
      const slug = value.displayName.toLowerCase().replace(/\s+/g, ".");

      if (permission) {
        const result = await updateTrigger({
          display_name: value.displayName,
          slug,
          description: value.description || null,
        });
        if (result?.status === 200) {
          toast.success(`Permiso "${value.displayName}" actualizado.`);
          form.reset();
          onSuccess();
        } else {
          toast.error("Error al actualizar el permiso.");
        }
      } else {
        const result = await createTrigger({
          display_name: value.displayName,
          slug,
          description: value.description || null,
        });
        if (result?.status === 201) {
          toast.success(`Permiso "${value.displayName}" creado.`);
          form.reset();
          onSuccess();
        } else {
          toast.error("Error al crear el permiso.");
        }
      }
    },
  });

  return (
    <Dialog
      key={permission?.id ?? "create"}
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>
            {permission ? "Editar Permiso" : "Crear Permiso"}
          </DialogTitle>
          <DialogDescription>
            {permission
              ? "Actualiza la información del permiso."
              : "Ingresa la información del nuevo permiso."}
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
                <Label htmlFor={field.name}>Nombre del Permiso</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="sales.create"
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
                  value={displayName.toLowerCase().replace(/\s+/g, ".")}
                  disabled
                />
              </div>
            )}
          </form.Subscribe>

          <form.Field name="description">
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Descripción (opcional)</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Permite crear ventas"
                />
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
                <Button
                  type="submit"
                  disabled={isSubmitting || isCreating || isUpdating}
                >
                  {isSubmitting || isCreating || isUpdating
                    ? "Guardando..."
                    : permission
                      ? "Guardar Cambios"
                      : "Crear Permiso"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
