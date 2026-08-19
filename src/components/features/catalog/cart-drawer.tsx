import { useNavigate } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";

import { CartItemRow } from "@/components/features/catalog/cart-item-row";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useGetCart } from "@/lib/cart/use-cart";
import { centsToPesos } from "@/lib/money";
import type { CartItem } from "@/lib/cart/use-cart";

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
  }).format(centsToPesos(amount));
}

function toCartItem(item: {
  id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  currency: string;
  display_name: string;
  sku: string;
  prices: { amount: number; currency: string; price_type: string }[];
  properties: { property_name: string; property_value: string }[];
  images: { image_url: string }[];
  line_total: number;
}): CartItem {
  return {
    ...item,
    cart_id: "local-cart",
    prices: item.prices.map((p) => ({
      id: "",
      variant_id: item.variant_id,
      amount: p.amount,
      currency: p.currency,
      price_type: p.price_type,
      status: "active",
      created_at: "",
      updated_at: "",
    })),
    properties: item.properties.map((p) => ({
      id: "",
      variant_id: item.variant_id,
      property_name: p.property_name,
      property_value: p.property_value,
      status: "active",
      created_at: "",
      updated_at: "",
    })),
    images: item.images.map((img) => ({
      id: "",
      variant_id: item.variant_id,
      file_id: "",
      image_url: img.image_url,
      image_index: 0,
      status: "active",
      created_at: "",
      updated_at: "",
    })),
  };
}

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const navigate = useNavigate();
  const { data: cartRes, isLoading } = useGetCart();

  const cart = cartRes?.status === 200 ? cartRes.data : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Tu Carrito</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden px-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="size-20 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : !cart || cart.item_count === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <ShoppingCart className="size-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Tu carrito está vacío
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  navigate({ to: "/" });
                }}
              >
                Ver productos
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-4 overflow-y-auto py-4">
                {cart.items.map((item) => (
                  <CartItemRow key={item.id} item={toCartItem(item)} />
                ))}
              </div>

              <Separator />

              <div className="space-y-3 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Artículos ({cart.item_count})
                  </span>
                  <span className="font-semibold">
                    {formatPrice(cart.subtotal, cart.currency)}
                  </span>
                </div>

                <Button
                  className="w-full bg-amber-500 text-black hover:bg-amber-600"
                  onClick={() => {
                    onOpenChange(false);
                    navigate({ to: "/cart" });
                  }}
                >
                  Ver carrito completo
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
