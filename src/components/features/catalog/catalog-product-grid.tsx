import { Loader2 } from "lucide-react";

import { ProductCard } from "./product-card";
import type { CatalogProduct } from "@/lib/api/schemas";

interface CatalogProductGridProps {
  products: CatalogProduct[];
  isLoading: boolean;
}

export function CatalogProductGrid({
  products,
  isLoading,
}: CatalogProductGridProps) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border">
        <p className="text-muted-foreground">
          No se encontraron productos con los filtros seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
