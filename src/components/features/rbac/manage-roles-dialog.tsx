import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Pencil, Trash2, Plus, CircleCheck, CircleX } from "lucide-react";
import { toast } from "sonner";

import {
  useListRolesHandler,
  useCreateRoleHandler,
  useUpdateRoleHandler,
  useDeleteRoleHandler,
} from "@/lib/api/api";
import type { Role } from "@/lib/api/schemas";

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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function RoleFormDialog({
  open,
  onOpenChange,
  role,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role;
  onSuccess: () => void;
}) {
  const { trigger: createTrigger, isMutating: isCreating } =
    useCreateRoleHandler();
  const { trigger: updateTrigger, isMutating: isUpdating } =
    useUpdateRoleHandler(role?.id ?? "");

  const form = useForm({
    defaultValues: {
      displayName: role?.display_name ?? "",
      isActive: role?.status === "active",
    },
    onSubmit: async ({ value }) => {
      const slug = value.displayName.toLowerCase().replace(/\s+/g, "-");

      if (role) {
        const result = await updateTrigger({
          display_name: value.displayName,
          slug,
          status: value.isActive ? "active" : "inactive",
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

  const displayName = form.baseStore.state.values.displayName;
  const slug = displayName.toLowerCase().replace(/\s+/g, "-");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" value={slug} disabled />
          </div>

          {role && (
            <form.Field name="isActive">
              {(field) => (
                <div className="flex items-center gap-2">
                  <Label id="is-active-label" htmlFor="is-active">
                    Activo
                  </Label>
                  <button
                    type="button"
                    id="is-active"
                    aria-labelledby="is-active-label"
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

function DeleteRoleDialog({
  open,
  onOpenChange,
  role,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Eliminar Rol</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de eliminar el rol{" "}
            <strong>{role.display_name}</strong>?
            {role.status === "active" && (
              <span className="mt-2 block text-destructive">
                Este rol está activo. Si tiene usuarios asignados no se podrá
                eliminar.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ManageRolesDialog() {
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);
  const [deleteRole, setDeleteRole] = useState<Role | undefined>(undefined);

  const { data, isLoading, mutate } = useListRolesHandler();
  const { trigger: deleteTrigger, isMutating: isDeleting } =
    useDeleteRoleHandler(deleteRole?.id ?? "");

  const handleCreate = () => {
    setEditingRole(undefined);
    setFormOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRole) return;
    try {
      const result = await deleteTrigger(null);
      if (result?.status === 200) {
        toast.success(`Rol "${deleteRole.display_name}" eliminado.`);
        setDeleteRole(undefined);
        mutate();
      } else if (result?.status === 409) {
        toast.error("No se puede eliminar: el rol tiene usuarios asignados.");
      } else {
        toast.error("Error al eliminar el rol.");
      }
    } catch {
      toast.error("Error al eliminar el rol.");
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingRole(undefined);
    mutate();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <Button>Gestionar Roles</Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Roles del Sistema</DialogTitle>
            <DialogDescription>
              Administra los roles de usuario y sus niveles de acceso.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {data?.data?.roles?.length ?? 0} rol(es) registrados
            </p>
            <Button onClick={handleCreate} size="sm">
              <Plus />
              Crear Rol
            </Button>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : data?.data?.roles?.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No hay roles registrados. Crea el primero.
              </p>
            ) : (
              data?.data?.roles
                ?.filter((r) => r.status !== "deleted")
                .map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium">
                          {role.display_name}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {role.slug}
                        </p>
                      </div>
                      <Badge
                        variant={
                          role.status === "active" ? "default" : "secondary"
                        }
                        className="gap-1"
                      >
                        {role.status === "active" ? (
                          <CircleCheck className="size-3" />
                        ) : (
                          <CircleX className="size-3" />
                        )}
                        {role.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(role)}
                        aria-label={`Editar ${role.display_name}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteRole(role)}
                        aria-label={`Eliminar ${role.display_name}`}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RoleFormDialog
        open={formOpen}
        onOpenChange={(next) => {
          setFormOpen(next);
          if (!next) setEditingRole(undefined);
        }}
        role={editingRole}
        onSuccess={handleFormSuccess}
      />

      {deleteRole && (
        <DeleteRoleDialog
          open={!!deleteRole}
          onOpenChange={(next) => !next && setDeleteRole(undefined)}
          role={deleteRole}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}
