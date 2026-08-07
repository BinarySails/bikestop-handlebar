import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteCategoryRequest } from "@/lib/api/api";
import type { Category } from "@/lib/api/schemas";

type CategoryDeleteDialogProps = {
  category: Category | null;
  categories: Category[];
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => Promise<void> | void;
};

export function CategoryDeleteDialog({
  category,
  categories,
  onOpenChange,
  onDeleted,
}: CategoryDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const childCount = category
    ? categories.filter((item) => item.parent_id === category.id).length
    : 0;

  async function handleDelete() {
    if (!category || isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await deleteCategoryRequest(category.id);
      if (result.status !== 200) {
        if (result.status === 404) toast.error("La categoría ya no existe.");
        else
          toast.error(
            result.data.message ?? "El servidor no pudo eliminar la categoría."
          );
        return;
      }
      toast.success(`Categoría “${category.display_name}” eliminada.`);
      await onDeleted?.();
      onOpenChange(false);
    } catch {
      toast.error("No se pudo eliminar la categoría.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={Boolean(category)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar categoría</DialogTitle>
          <DialogDescription>
            Esta acción eliminará “{category?.display_name}”. No se puede
            deshacer.
          </DialogDescription>
        </DialogHeader>
        {childCount > 0 && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            Esta categoría tiene {childCount}{" "}
            {childCount === 1 ? "hija directa" : "hijas directas"} en los datos
            cargados. El backend determinará si puede eliminarse.
          </div>
        )}
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
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? "Eliminando..." : "Eliminar categoría"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
