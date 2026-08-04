import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Brand } from "@/lib/api/schemas";

export type BrandAction = "archive" | "toggle";

type BrandActionDialogProps = {
  brand: Brand | null;
  action: BrandAction;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function BrandActionDialog({
  brand,
  action,
  pending = false,
  onOpenChange,
  onConfirm,
}: BrandActionDialogProps) {
  const isArchive = action === "archive";
  const willEnable = brand?.status === "disable";
  const actionLabel = isArchive
    ? "Archivar"
    : willEnable
      ? "Activar"
      : "Desactivar";

  return (
    <Dialog open={Boolean(brand)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionLabel} marca</DialogTitle>
          <DialogDescription>
            {isArchive
              ? `“${brand?.display_name}” se marcará como archivada y ya no podrá activarse o desactivarse.`
              : `¿Deseas ${actionLabel.toLowerCase()} “${brand?.display_name}”?`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant={isArchive ? "destructive" : "default"}
            disabled={pending || brand?.status === "archive"}
            onClick={onConfirm}
          >
            {pending ? "Procesando..." : `${actionLabel} marca`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
