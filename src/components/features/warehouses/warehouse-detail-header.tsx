import { Link } from "@tanstack/react-router";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WarehouseResponse } from "@/lib/api/schemas";

type WarehouseStatus = WarehouseResponse["status"];

const statusLabel: Record<WarehouseStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
};

type WarehouseDetailHeaderProps = {
  warehouse: WarehouseResponse;
  isDirty?: boolean;
  isSubmitting?: boolean;
  onSave?: () => void;
  onDeleteClick?: () => void;
};

export function WarehouseDetailHeader({
  warehouse,
  isDirty,
  isSubmitting,
  onSave,
  onDeleteClick,
}: WarehouseDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button
          render={<Link to="/warehouses" />}
          variant="ghost"
          size="icon"
          aria-label="Volver a todos los almacenes"
          className="size-9"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-semibold tracking-tight">Almacén</h1>
        <Badge variant="outline">{statusLabel[warehouse.status]}</Badge>
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
      ) : warehouse.status === "active" ? (
        <Button type="button" variant="destructive" onClick={onDeleteClick}>
          <Trash2 className="size-4" />
          <span>Eliminar</span>
        </Button>
      ) : null}
    </div>
  );
}
