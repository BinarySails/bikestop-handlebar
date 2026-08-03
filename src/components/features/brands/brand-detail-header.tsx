import { Link } from "@tanstack/react-router";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Brand } from "@/lib/api/schemas";

const statusLabel: Record<Brand["status"], string> = {
  enable: "Activa",
  disable: "Inactiva",
  archive: "Archivada",
};

type BrandDetailHeaderProps = {
  brand: Brand;
  isDirty?: boolean;
  isSubmitting?: boolean;
  onSave?: () => void;
  onDeleteClick?: () => void;
};

export function BrandDetailHeader({
  brand,
  isDirty,
  isSubmitting,
  onSave,
  onDeleteClick,
}: BrandDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button
          render={<Link to="/brands" />}
          variant="ghost"
          size="icon"
          aria-label="Volver a todas las marcas"
          className="size-9"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-semibold tracking-tight">Marca</h1>
        <Badge variant="outline">{statusLabel[brand.status]}</Badge>
      </div>

      {isDirty ? (
        <Button type="submit" disabled={isSubmitting} onClick={onSave}>
          {isSubmitting ? (
            <span>Guardando...</span>
          ) : (
            <>
              <Save className="size-4" />
              <span>Guardar cambios</span>
            </>
          )}
        </Button>
      ) : brand.status !== "archive" ? (
        <Button type="button" variant="destructive" onClick={onDeleteClick}>
          <Trash2 className="size-4" />
          <span>Eliminar</span>
        </Button>
      ) : null}
    </div>
  );
}
