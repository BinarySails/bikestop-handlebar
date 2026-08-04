import { useState } from "react";
import { toast } from "sonner";

import {
  useListRolesHandler,
  useListPermissionsHandler,
  useListRolePermissionsHandler,
  useAssignPermissionsHandler,
  useRemovePermissionsHandler,
} from "@/lib/api/api";
import type { Role, Permission } from "@/lib/api/schemas";

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

function PermissionToggle({
  permission,
  isAssigned,
  onToggle,
  disabled,
}: {
  permission: Permission;
  isAssigned: boolean;
  onToggle: (permissionId: string, assign: boolean) => void;
  disabled: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{permission.display_name}</span>
        {permission.description && (
          <span className="text-xs text-muted-foreground">
            {permission.description}
          </span>
        )}
        <span className="font-mono text-[10px] text-muted-foreground">
          {permission.slug}
        </span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isAssigned}
        aria-label={`${isAssigned ? "Revocar" : "Asignar"} permiso ${permission.display_name}`}
        disabled={disabled}
        onClick={() => onToggle(permission.id, !isAssigned)}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-input transition-colors disabled:cursor-not-allowed disabled:opacity-50 aria-checked:bg-primary"
      >
        <span className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white shadow-sm ring-0 transition-transform aria-checked:translate-x-5" />
      </button>
    </label>
  );
}

export function ManageRolePermissionsDialog() {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());

  const { data: rolesData, isLoading: rolesLoading } = useListRolesHandler();
  const { data: permissionsData, isLoading: permissionsLoading } =
    useListPermissionsHandler();
  const {
    data: rolePermissionsData,
    isLoading: rolePermsLoading,
    mutate: mutateRolePerms,
  } = useListRolePermissionsHandler(selectedRole?.id ?? "", {
    swr: { enabled: !!selectedRole },
  });

  const { trigger: assignTrigger, isMutating: isAssigning } =
    useAssignPermissionsHandler(selectedRole?.id ?? "");
  const { trigger: removeTrigger, isMutating: isRemoving } =
    useRemovePermissionsHandler(selectedRole?.id ?? "");

  const roles = rolesData?.data?.roles ?? [];
  const allPermissions = permissionsData?.data?.permissions ?? [];
  const assignedPermissions = rolePermissionsData?.data?.permissions ?? [];
  const assignedIds = new Set(assignedPermissions.map((p) => p.id));
  const isMutating = isAssigning || isRemoving;

  const handleToggle = async (permissionId: string, assign: boolean) => {
    if (!selectedRole || isMutating) return;

    const changeKey = `${assign ? "add" : "remove"}-${permissionId}`;
    setPendingChanges((prev) => new Set(prev).add(changeKey));

    try {
      if (assign) {
        const result = await assignTrigger({ permission_ids: [permissionId] });
        if (result.status !== 200) {
          toast.error("Error al asignar permiso.");
        }
      } else {
        const result = await removeTrigger({ permission_ids: [permissionId] });
        if (result.status !== 200) {
          toast.error("Error al remover permiso.");
        }
      }
      mutateRolePerms();
    } catch {
      toast.error("Error al actualizar permiso.");
    } finally {
      setPendingChanges((prev) => {
        const next = new Set(prev);
        next.delete(changeKey);
        return next;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>Gestionar Permisos de Roles</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Permisos por Rol</DialogTitle>
          <DialogDescription>
            Selecciona un rol y asigna o remueve sus permisos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_2fr] gap-4">
          <div className="space-y-1">
            <p className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Roles
            </p>
            {rolesLoading ? (
              <div className="space-y-1">
                <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />
                <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />
              </div>
            ) : roles.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                No hay roles.
              </p>
            ) : (
              roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    selectedRole?.id === role.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <span className="font-medium">{role.display_name}</span>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {role.slug}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="space-y-1">
            <p className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Permisos
              {selectedRole && (
                <span className="ml-1 font-normal lowercase">
                  — <strong>{selectedRole.display_name}</strong>
                </span>
              )}
            </p>
            {!selectedRole ? (
              <p className="py-2 text-sm text-muted-foreground">
                Selecciona un rol para gestionar sus permisos.
              </p>
            ) : permissionsLoading || rolePermsLoading ? (
              <div className="space-y-1">
                <div className="h-14 w-full animate-pulse rounded-lg bg-muted" />
                <div className="h-14 w-full animate-pulse rounded-lg bg-muted" />
                <div className="h-14 w-full animate-pulse rounded-lg bg-muted" />
              </div>
            ) : allPermissions.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                No hay permisos disponibles. Crea permisos primero.
              </p>
            ) : (
              <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
                {allPermissions.map((permission) => {
                  const changeKey = `${assignedIds.has(permission.id) ? "remove" : "add"}-${permission.id}`;
                  return (
                    <PermissionToggle
                      key={permission.id}
                      permission={permission}
                      isAssigned={assignedIds.has(permission.id)}
                      onToggle={handleToggle}
                      disabled={isMutating || pendingChanges.has(changeKey)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
