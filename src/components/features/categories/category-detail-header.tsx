import { Link } from "@tanstack/react-router";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Category } from "@/lib/api/schemas";

const statusLabel: Record<Category["status"], string> = {
  active: "Activa",
  inactive: "Inactiva",
};

type CategoryDetailHeaderProps = {
  category: Category;
  isDirty?: boolean;
  isSubmitting?: boolean;
  onSave?: () => void;
  onDeleteClick?: () => void;
};

export function CategoryDetailHeader({
  category,
  isDirty,
  isSubmitting,
  onSave,
  onDeleteClick,
}: CategoryDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button
          render={<Link to="/categories" />}
          variant="ghost"
          size="icon"
          aria-label="Volver a todas las categorías"
          className="size-9"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-semibold tracking-tight">Categoría</h1>
        <Badge variant="outline">{statusLabel[category.status]}</Badge>
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
      ) : category.status !== "inactive" ? (
        <Button type="button" variant="destructive" onClick={onDeleteClick}>
          <Trash2 className="size-4" />
          <span>Eliminar</span>
        </Button>
      ) : null}
    </div>
  );
}
