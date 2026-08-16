import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { CreatePromotionForm } from "./create-promotion-form";

type CreatePromotionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => Promise<void> | void;
};

export function CreatePromotionDialog({
  open,
  onOpenChange,
  onSaved,
}: CreatePromotionDialogProps) {
  const [openCount, setOpenCount] = useState(0);

  useEffect(() => {
    if (open) setOpenCount((count) => count + 1);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Crear promoción</DialogTitle>
          <DialogDescription>
            Define el tipo de descuento y las condiciones para aplicarlo a tus
            órdenes de venta.
          </DialogDescription>
        </DialogHeader>
        <CreatePromotionForm
          key={openCount}
          onSaved={async () => {
            await onSaved?.();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
