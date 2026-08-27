import type { Role } from "@/lib/api/schemas";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteRoleDialog({
  open,
  onOpenChange,
  role,
  onConfirm,
  isDeleting,
}: DeleteRoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Eliminar Rol</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de eliminar el rol{" "}
            <strong>{role.display_name}</strong>?
            {role.status === "enable" && (
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
