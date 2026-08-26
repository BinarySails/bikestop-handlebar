import { useListRolePermissionsHandler } from "@/lib/api/api";
import type { Role } from "@/lib/api/schemas";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RolePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  onOpenAssign: () => void;
}

export function RolePermissionsDialog({
  open,
  onOpenChange,
  role,
  onOpenAssign,
}: RolePermissionsDialogProps) {
  const { data, isLoading } = useListRolePermissionsHandler(role?.id ?? "", {
    swr: { enabled: !!role },
  });

  const permissions = data?.data?.permissions ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Permisos de {role?.display_name}</DialogTitle>
          <DialogDescription>
            Permisos asignados actualmente a este rol.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[40vh] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : permissions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Este rol no tiene permisos asignados.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {permissions.map((perm) => (
                <div
                  key={perm.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">
                      {perm.display_name}
                    </span>
                    <span className="truncate font-mono text-[10px] text-muted-foreground">
                      {perm.slug}
                    </span>
                  </div>
                  <Badge
                    variant={perm.status === "enable" ? "default" : "secondary"}
                    className="ml-2 shrink-0"
                  >
                    {perm.status === "enable" ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={onOpenAssign}>+ Agregar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
