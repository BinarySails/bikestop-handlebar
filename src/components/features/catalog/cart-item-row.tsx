import { useState } from "react";
import { ImageOff, Loader2, Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CartItem } from "@/lib/cart/use-cart";
import { useDeleteCartItem, useUpdateCartItem } from "@/lib/cart/use-cart";
import { centsToPesos } from "@/lib/money";

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
  }).format(centsToPesos(amount));
}

function formatProperties(properties: CartItem["properties"]) {
  return properties.map((p) => p.property_value).join(", ");
}

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const [optimisticQty, setOptimisticQty] = useState(item.quantity);
  const { trigger: updateItem, isMutating: isUpdating } = useUpdateCartItem();
  const { trigger: deleteItem, isMutating: isDeleting } = useDeleteCartItem();

  const mainImage = (item.images ?? [])[0];
  const isMutating = isUpdating || isDeleting;

  async function handleQuantityChange(newQty: number) {
    if (newQty < 1) return;
    setOptimisticQty(newQty);
    try {
      await updateItem({ itemId: item.id, quantity: newQty });
    } catch {
      setOptimisticQty(item.quantity);
    }
  }

  async function handleRemove() {
    try {
      await deleteItem({ itemId: item.id });
    } catch {
      // silent
    }
  }

  return (
    <Card>
      <CardContent>
        <div className="flex gap-4">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted">
            {mainImage ? (
              <img
                src={mainImage.image_url}
                alt={item.display_name}
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <ImageOff className="size-6" />
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h3 className="truncate text-sm font-semibold">
              {item.display_name}
            </h3>
            {item.properties.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {formatProperties(item.properties)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
            <p className="text-sm font-medium">
              Precio unitario: {formatPrice(item.unit_price, item.currency)}
            </p>
          </div>
        </div>
      </CardContent>

      <Separator />

      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Cantidad:</span>
          <div className="flex items-center rounded-lg border">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleQuantityChange(optimisticQty - 1)}
              disabled={optimisticQty <= 1 || isMutating}
            >
              <Minus className="size-3" />
            </Button>
            <span className="w-8 text-center text-sm tabular-nums">
              {optimisticQty}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleQuantityChange(optimisticQty + 1)}
              disabled={isMutating}
            >
              <Plus className="size-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <p className="text-sm font-bold">
            Total: {formatPrice(item.line_total, item.currency)}
          </p>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleRemove}
            disabled={isMutating}
            className="text-destructive hover:text-destructive"
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
