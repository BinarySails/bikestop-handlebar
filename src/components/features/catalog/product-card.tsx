import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { CatalogProduct } from "@/lib/api/schemas";
import { centsToPesos, resolvePrice } from "@/lib/money";

interface ProductCardProps {
  product: CatalogProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const mainImage = [...product.images].sort(
    (a, b) => a.image_index - b.image_index
  )[0];
  const regularPrice = resolvePrice(product.default_price, product.prices);
  const isAvailable = product.stock_quantity > 0;

  return (
    <Link
      to="/b2b/$productId"
      params={{ productId: product.id }}
      className="group block"
    >
      <Card className="cursor-pointer overflow-hidden border transition-shadow hover:shadow-md">
        <div className="relative aspect-square bg-muted">
          {mainImage ? (
            <img
              src={mainImage.image_url}
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
          {regularPrice ? (
            <p className="text-sm font-semibold">
              {new Intl.NumberFormat("es-MX", {
                style: "currency",
                currency: regularPrice.currency,
              }).format(centsToPesos(regularPrice.amount))}
            </p>
          ) : null}
          {!isAvailable && <p className="text-xs text-destructive">Agotado</p>}
        </CardContent>
      </Card>
    </Link>
  );
}
