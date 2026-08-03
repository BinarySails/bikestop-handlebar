import { toast } from "sonner";

import {
  useListPermissionsHandler,
  useListRolePermissionsHandler,
  useAssignPermissionsHandler,
  useRemovePermissionsHandler,
} from "@/lib/api/api";
import type { Role } from "@/lib/api/schemas";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AssignPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  onBack: () => void;
}

export function AssignPermissionsDialog({
  open,
  onOpenChange,
  role,
  onBack,
}: AssignPermissionsDialogProps) {
  const { data: permissionsData, isLoading: permissionsLoading } =
    useListPermissionsHandler();
  const {
    data: rolePermissionsData,
    isLoading: rolePermsLoading,
    mutate: mutateRolePerms,
  } = useListRolePermissionsHandler(role?.id ?? "", {
    swr: { enabled: !!role && open },
  });

  const { trigger: assignTrigger, isMutating: isAssigning } =
    useAssignPermissionsHandler(role?.id ?? "");
  const { trigger: removeTrigger, isMutating: isRemoving } =
    useRemovePermissionsHandler(role?.id ?? "");

  const allPermissions = permissionsData?.data?.permissions ?? [];
  const assignedPermissions = rolePermissionsData?.data?.permissions ?? [];
  const assignedIds = new Set(assignedPermissions.map((p) => p.id));
  const isMutating = isAssigning || isRemoving;

  const handleToggle = async (permissionId: string, assign: boolean) => {
    if (!role || isMutating) return;

    try {
      if (assign) {
        const result = await assignTrigger({ permission_ids: [permissionId] });
        if (result.status !== 200) {
          toast.error("Error al asignar permiso.");
          return;
        }
      } else {
        const result = await removeTrigger({ permission_ids: [permissionId] });
        if (result.status !== 200) {
          toast.error("Error al remover permiso.");
          return;
        }
      }
      mutateRolePerms();
    } catch {
      toast.error("Error al actualizar permiso.");
    }
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Asignar Permisos — {role?.display_name}</DialogTitle>
          <DialogDescription>
            Selecciona o deselecciona los permisos para este rol.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[45vh] overflow-y-auto pr-1">
          {permissionsLoading || rolePermsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : allPermissions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No hay permisos disponibles.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {allPermissions.map((permission) => {
                const isChecked = assignedIds.has(permission.id);
                return (
                  <button
                    key={permission.id}
                    type="button"
                    onClick={() => {
                      if (!isMutating) {
                        handleToggle(permission.id, !isChecked);
                      }
                    }}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <Checkbox checked={isChecked} disabled={isMutating} />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium">
                        {permission.display_name}
                      </span>
                      <span className="truncate font-mono text-[10px] text-muted-foreground">
                        {permission.slug}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onBack();
            }}
          >
            Ver permisos asignados
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
