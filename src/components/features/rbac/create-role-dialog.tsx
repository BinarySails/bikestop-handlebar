import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import { useCreateRoleHandler, useUpdateRoleHandler } from "@/lib/api/api";
import type { Role, RoleStatus } from "@/lib/api/schemas";

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
import { cn } from "@/lib/utils";

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role;
  onSuccess: () => void;
}

export function CreateRoleDialog({
  open,
  onOpenChange,
  role,
  onSuccess,
}: CreateRoleDialogProps) {
  const { trigger: createTrigger, isMutating: isCreating } =
    useCreateRoleHandler();
  const { trigger: updateTrigger, isMutating: isUpdating } =
    useUpdateRoleHandler(role?.id ?? "");

  const form = useForm({
    defaultValues: {
      displayName: role?.display_name ?? "",
      isActive: role?.status === "enable",
    },
    onSubmit: async ({ value }) => {
      const slug = value.displayName.toLowerCase().replace(/\s+/g, "-");

      if (role) {
        const result = await updateTrigger({
          display_name: value.displayName,
          slug,
          status: (value.isActive ? "active" : "inactive") as RoleStatus,
        });
        if (result?.status === 200) {
          toast.success(`Rol "${value.displayName}" actualizado.`);
          form.reset();
          onSuccess();
        } else {
          toast.error("Error al actualizar el rol.");
        }
      } else {
        const result = await createTrigger({
          display_name: value.displayName,
          slug,
        });
        if (result?.status === 201) {
          toast.success(`Rol "${value.displayName}" creado.`);
          form.reset();
          onSuccess();
        } else {
          toast.error("Error al crear el rol.");
        }
      }
    },
  });

  return (
    <Dialog key={role?.id ?? "create"} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>{role ? "Editar Rol" : "Crear Rol"}</DialogTitle>
          <DialogDescription>
            {role
              ? "Actualiza el nombre y estado del rol."
              : "Ingresa la información del nuevo rol."}
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
                <Label htmlFor={field.name}>Nombre del Rol</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Administrador"
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

          {role && (
            <form.Field name="isActive">
              {(field) => (
                <div className="flex items-center gap-2">
                  <Label htmlFor="is-active">Activo</Label>
                  <button
                    type="button"
                    id="is-active"
                    aria-label="Activo"
                    onClick={() => field.handleChange(!field.state.value)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      field.state.value ? "bg-primary" : "bg-input"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform",
                        field.state.value ? "translate-x-5" : "translate-x-0"
                      )}
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
                <Button
                  type="submit"
                  disabled={isSubmitting || isCreating || isUpdating}
                >
                  {isSubmitting || isCreating || isUpdating
                    ? "Guardando..."
                    : role
                      ? "Guardar Cambios"
                      : "Crear Rol"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
