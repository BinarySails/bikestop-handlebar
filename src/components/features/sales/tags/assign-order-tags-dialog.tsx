import { useState } from "react";
import { toast } from "sonner";

import { useListTagsRequest, updateSalesOrderTagsRequest } from "@/lib/api/api";
import type {
  OrderTag,
  OrderTagId,
  SalesOrderSummaryView,
} from "@/lib/api/schemas";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

type AssignOrderTagsDialogProps = {
  order: SalesOrderSummaryView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

function tagSwatch(tag: OrderTag) {
  return (
    <span
      aria-hidden
      className="size-2.5 shrink-0 rounded-full"
      style={{
        backgroundColor: tag.color ?? undefined,
      }}
    />
  );
}

export function AssignOrderTagsDialog({
  order,
  open,
  onOpenChange,
  onSaved,
}: AssignOrderTagsDialogProps) {
  const [selectedIds, setSelectedIds] = useState<OrderTagId[]>([]);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useListTagsRequest(
    open ? { status: "enable" } : undefined
  );
  const tags = data?.status === 200 ? data.data.tags : [];

  function handleOpenChange(next: boolean) {
    if (next) {
      setSelectedIds(order?.tags.map((tag) => tag.id) ?? []);
    } else {
      setSelectedIds([]);
    }
    onOpenChange(next);
  }

  function toggleTag(tag: OrderTagId) {
    setSelectedIds((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    );
  }

  async function handleSave() {
    if (!order || saving) return;
    setSaving(true);
    try {
      const result = await updateSalesOrderTagsRequest(order.id, {
        order_tag_ids: selectedIds,
      });
      if (result.status !== 200) throw result;
      toast.success("Etiquetas actualizadas.");
      onSaved();
      handleOpenChange(false);
    } catch {
      toast.error("No se pudieron actualizar las etiquetas.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Etiquetas de {order?.order_number}</DialogTitle>
          <DialogDescription>
            Marca las etiquetas que quieres asignar a la orden de venta.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </div>
          ) : tags.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              No hay etiquetas activas disponibles.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {tags.map((tag) => {
                const checked = selectedIds.includes(tag.id);
                return (
                  <label
                    key={tag.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleTag(tag.id)}
                    />
                    {tagSwatch(tag)}
                    <span className="truncate">{tag.display_name}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || isLoading}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
