import { Link } from "@tanstack/react-router";
import { ArrowLeft, List, Save, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/api/schemas";

const statusLabel: Record<Product["status"], string> = {
  enable: "Activo",
  disable: "Inactivo",
  archive: "Archivado",
};

type ProductDetailHeaderProps = {
  product: Product;
  productId: string;
  isDirty?: boolean;
  isSubmitting?: boolean;
  onSave?: () => void;
  onDeleteClick?: () => void;
};

export function ProductDetailHeader({
  product,
  productId,
  isDirty,
  isSubmitting,
  onSave,
  onDeleteClick,
}: ProductDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button
          render={<Link to="/products" />}
          variant="ghost"
          size="icon"
          aria-label="Volver a todos los productos"
          className="size-9"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-semibold tracking-tight">Producto</h1>
        <Badge variant="outline">{statusLabel[product.status]}</Badge>
      </div>

      <div className="flex items-center gap-2">
        <Button
          render={
            <Link to="/products/$productId/variants" params={{ productId }} />
          }
          variant="outline"
        >
          <List className="size-4" />
          <span>Ver variantes</span>
        </Button>

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
        ) : product.status !== "archive" ? (
          <Button type="button" variant="destructive" onClick={onDeleteClick}>
            <Trash2 className="size-4" />
            <span>Eliminar</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
