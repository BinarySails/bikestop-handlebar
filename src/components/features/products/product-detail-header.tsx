import { Link } from "@tanstack/react-router";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

import { CreateVariantDialog } from "@/components/features/products/create-variant-modal";
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
  onVariantCreated?: () => Promise<unknown>;
};

export function ProductDetailHeader({
  product,
  productId,
  isDirty,
  isSubmitting,
  onSave,
  onDeleteClick,
  onVariantCreated,
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
        <CreateVariantDialog
          productId={productId}
          onSuccess={onVariantCreated}
        />

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
