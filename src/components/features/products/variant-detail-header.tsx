import { Link } from "@tanstack/react-router";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Variant } from "@/lib/api/schemas";

const statusLabel: Record<Variant["status"], string> = {
  enable: "Activo",
  disable: "Inactivo",
  archive: "Archivado",
};

type VariantDetailHeaderProps = {
  productId: string;
  variant: Variant;
  isDirty?: boolean;
  isSubmitting?: boolean;
  onSave?: () => void;
  onDeleteClick?: () => void;
};

export function VariantDetailHeader({
  productId,
  variant,
  isDirty,
  isSubmitting,
  onSave,
  onDeleteClick,
}: VariantDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button
          render={<Link to="/products/$productId" params={{ productId }} />}
          variant="ghost"
          size="icon"
          aria-label="Volver al producto"
          className="size-9"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-semibold tracking-tight">Variante</h1>
        <Badge variant="outline">{statusLabel[variant.status]}</Badge>
      </div>

      {isDirty ? (
        <Button type="button" disabled={isSubmitting} onClick={onSave}>
          {isSubmitting ? (
            <span>Guardando...</span>
          ) : (
            <>
              <Save className="size-4" />
              <span>Guardar cambios</span>
            </>
          )}
        </Button>
      ) : variant.status !== "archive" ? (
        <Button type="button" variant="destructive" onClick={onDeleteClick}>
          <Trash2 className="size-4" />
          <span>Eliminar</span>
        </Button>
      ) : null}
    </div>
  );
}
