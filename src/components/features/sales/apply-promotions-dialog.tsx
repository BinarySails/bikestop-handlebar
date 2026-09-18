import { useState } from "react";
import { BadgePercent } from "lucide-react";
import { toast } from "sonner";

import {
  discountValueLabel,
  promotionKind,
} from "@/components/features/promotions/promotion-labels";
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
import {
  applyPromotionsRequest,
  useListActivePromotionsRequest,
} from "@/lib/api/api";
import type { Promotion, SalesOrder } from "@/lib/api/schemas";

type ApplyPromotionsDialogProps = {
  order: SalesOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplied: () => Promise<void> | void;
};

function appliedPromotionCodes(order: SalesOrder | null): Set<string> {
  const codes = new Set<string>();
  if (!order) return codes;
  for (const line of order.lines) {
    for (const adjustment of line.adjustments) {
      if ("Promotion" in adjustment.source) {
        codes.add(adjustment.source.Promotion.code);
      }
    }
  }
  return codes;
}

export function ApplyPromotionsDialog({
  order,
  open,
  onOpenChange,
  onApplied,
}: ApplyPromotionsDialogProps) {
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useListActivePromotionsRequest({
    swr: { enabled: open },
  });
  const promotions =
    data?.status === 200
      ? data.data.filter((promotion) => !promotion.is_automatic)
      : [];
  const alreadyApplied = appliedPromotionCodes(order);

  function handleOpenChange(next: boolean) {
    if (next) {
      setSelectedCodes([]);
    }
    onOpenChange(next);
  }

  function toggleCode(code: string) {
    setSelectedCodes((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code]
    );
  }

  async function handleApply() {
    if (!order || saving || selectedCodes.length === 0) return;
    setSaving(true);
    try {
      const result = await applyPromotionsRequest(order.id, {
        promotion_codes: selectedCodes,
      });
      if (result.status !== 200) {
        const message =
          "message" in result.data ? result.data.message : undefined;
        throw new Error(
          message ??
            (result.status === 409
              ? "No se pudieron aplicar las promociones a esta orden."
              : "Error al aplicar las promociones.")
        );
      }
      toast.success("Promociones aplicadas a la orden.");
      await onApplied();
      handleOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudieron aplicar las promociones."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Promociones de {order?.order_number}</DialogTitle>
          <DialogDescription>
            Selecciona las promociones que quieres aplicar a la orden de venta.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : promotions.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              No hay promociones disponibles para aplicar.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {promotions.map((promotion: Promotion) => {
                const isApplied = alreadyApplied.has(promotion.code);
                const checked =
                  isApplied || selectedCodes.includes(promotion.code);
                return (
                  <label
                    key={promotion.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed"
                  >
                    <Checkbox
                      checked={checked}
                      disabled={isApplied}
                      onCheckedChange={() => toggleCode(promotion.code)}
                    />
                    <BadgePercent className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="font-medium tracking-tight">
                          {promotion.code}
                        </span>
                        {isApplied && (
                          <span className="text-xs text-muted-foreground">
                            (ya aplicada)
                          </span>
                        )}
                      </span>
                      {!isApplied && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {promotionKind(promotion)} ·{" "}
                          {discountValueLabel(promotion)}
                        </span>
                      )}
                    </span>
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
            onClick={handleApply}
            disabled={saving || isLoading || selectedCodes.length === 0}
          >
            {saving ? "Aplicando..." : "Aplicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
