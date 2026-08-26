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

interface DeletePermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission: Permission;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeletePermissionDialog({
  open,
  onOpenChange,
  permission,
  onConfirm,
  isDeleting,
}: DeletePermissionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Eliminar Permiso</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de eliminar el permiso{" "}
            <strong>{permission.display_name}</strong>?
            {permission.status === "enable" && (
              <span className="mt-2 block text-destructive">
                Este permiso está activo. Si está asignado a algún rol, se
                removerá automáticamente.
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
