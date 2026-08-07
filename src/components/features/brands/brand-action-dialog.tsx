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

type BrandActionDialogProps = {
  brand: Brand | null;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function BrandActionDialog({
  brand,
  pending = false,
  onOpenChange,
  onConfirm,
}: BrandActionDialogProps) {
  return (
    <Dialog open={Boolean(brand)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archivar marca</DialogTitle>
          <DialogDescription>
            {`“${brand?.display_name}” se marcará como archivada y dejará de estar disponible.`}
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
            variant="destructive"
            disabled={pending || brand?.status === "archive"}
            onClick={onConfirm}
          >
            {pending ? "Procesando..." : "Archivar marca"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
