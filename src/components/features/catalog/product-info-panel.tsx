import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CatalogProduct } from "@/lib/api/schemas";
import { useAddToCart } from "@/lib/cart/use-cart";
import { useCartDrawerStore } from "@/lib/cart/use-cart-drawer-store";
import { centsToPesos } from "@/lib/money";

interface ProductInfoPanelProps {
  product: CatalogProduct;
}

export function ProductInfoPanel({ product }: ProductInfoPanelProps) {
  const [quantity, setQuantity] = useState(1);
  const { trigger: addToCart, isMutating: isAdding } = useAddToCart();
  const setDrawerOpen = useCartDrawerStore((s) => s.setOpen);
  const regularPrice =
    product.default_price ??
    product.prices.find((price) => price.price_type === "regular");
  const isAvailable = product.stock_quantity > 0;

  function decrement() {
    setQuantity((prev) => Math.max(1, prev - 1));
  }

  function increment() {
    setQuantity((prev) => Math.min(product.stock_quantity, prev + 1));
  }

  async function handleAddToCart() {
    try {
      await addToCart({ product, quantity });
      setQuantity(1);
      setDrawerOpen(true);
    } catch {
      toast.error("Error al agregar al carrito");
    }
  }

  return (
    <div className="flex flex-col gap-2.5 lg:h-full lg:min-h-0 lg:overflow-y-auto">
      <div className="space-y-0.5">
        <p className="text-sm text-muted-foreground">
          {product.brand.display_name}
        </p>
        <h1 className="text-xl font-semibold text-balance">
          {product.display_name}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={isAvailable ? "default" : "destructive"}>
          {isAvailable ? "Disponible" : "Agotado"}
        </Badge>
        <span className="text-sm text-muted-foreground">
          SKU: {product.sku}
        </span>
      </div>

      {regularPrice && (
        <p className="text-2xl font-bold">
          {new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: regularPrice.currency,
          }).format(centsToPesos(regularPrice.amount))}
        </p>
      )}

      {product.description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>
      )}

      {product.properties.length > 0 && (
        <ul className="space-y-1">
          {product.properties.map((property) => (
            <li key={property.id} className="flex gap-2 text-sm">
              <span className="text-muted-foreground">
                {property.property_name}:
              </span>
              <span className="font-medium">{property.property_value}</span>
            </li>
          ))}
        </ul>
      )}

      <Separator />

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={decrement}
            disabled={!isAvailable || quantity <= 1}
            aria-label="Disminuir cantidad"
          >
            <Minus />
          </Button>
          <span className="w-8 text-center text-sm font-medium">
            {quantity}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={increment}
            disabled={!isAvailable || quantity >= product.stock_quantity}
            aria-label="Aumentar cantidad"
          >
            <Plus />
          </Button>
        </div>

        <Button
          className="flex-1 bg-amber-500 text-black hover:bg-amber-600"
          disabled={!isAvailable || isAdding}
          onClick={handleAddToCart}
        >
          <ShoppingCart />
          {isAdding ? "Agregando..." : "Agregar al Carrito"}
        </Button>
      </div>

      <Separator />

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Marca</dt>
        <dd className="font-medium">{product.brand.display_name}</dd>
        <dt className="text-muted-foreground">Categoría</dt>
        <dd className="font-medium">{product.category.display_name}</dd>
        <dt className="text-muted-foreground">SKU</dt>
        <dd className="font-medium">{product.sku}</dd>
      </dl>
    </div>
  );
}
