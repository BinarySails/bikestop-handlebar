import { ImageOff } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { CatalogProduct } from "@/lib/api/schemas";
import { centsToPesos } from "@/lib/money";

interface ProductCardProps {
  product: CatalogProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="group overflow-hidden border transition-shadow hover:shadow-md">
      <div className="relative aspect-square bg-muted">
        {product.main_image_url ? (
          <img
            src={product.main_image_url}
            alt={product.display_name}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="size-8" />
            <span className="text-xs">Imagen no disponible</span>
          </div>
        )}
      </div>
      <CardContent className="space-y-1 p-3">
        <p className="text-xs text-muted-foreground">
          {product.brand.display_name}
        </p>
        <h3 className="line-clamp-2 text-sm text-blue-600 group-hover:underline">
          {product.display_name}
        </h3>
        {product.default_price ? (
          <p className="text-sm font-semibold">
            {new Intl.NumberFormat("es-MX", {
              style: "currency",
              currency: product.default_price.currency,
            }).format(centsToPesos(product.default_price.amount))}
          </p>
        ) : null}
        {!product.is_available && (
          <p className="text-xs text-destructive">Agotado</p>
        )}
      </CardContent>
    </Card>
  );
}
