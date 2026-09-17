import { useState } from "react";
import { useNavigate, createFileRoute } from "@tanstack/react-router";
import { Loader2, ShoppingCart } from "lucide-react";

import { CartItemRow } from "@/components/features/catalog/cart-item-row";
import { CartSummary } from "@/components/features/catalog/cart-summary";
import { CheckoutDialog } from "@/components/features/catalog/checkout-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCart, useClearCart } from "@/lib/cart/use-cart";

export const Route = createFileRoute("/b2b/cart/")({
  component: CartPage,
});

function CartSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <div className="flex gap-4 p-4">
            <Skeleton className="size-24 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function CartPage() {
  const navigate = useNavigate();
  const { data: cartRes, isLoading } = useGetCart();
  const { trigger: clearCart, isMutating: isClearing } = useClearCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const cart = cartRes?.status === 200 ? cartRes.data : null;

  function handleCheckout(_promoCodes: string[]) {
    setIsCheckoutOpen(true);
  }

  async function handleClearCart() {
    await clearCart();
  }

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tu Carrito</h1>
          {cart && cart.item_count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCart}
              disabled={isClearing}
              className="text-destructive hover:text-destructive"
            >
              {isClearing ? <Loader2 className="size-4 animate-spin" /> : null}
              Vaciar carrito
            </Button>
          )}
        </div>

        <Separator />

        {isLoading ? (
          <CartSkeleton />
        ) : !cart || cart.item_count === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border py-16">
            <ShoppingCart className="size-12 text-muted-foreground" />
            <p className="text-muted-foreground">Tu carrito está vacío</p>
            <Button variant="outline" onClick={() => navigate({ to: "/" })}>
              Ver productos
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {cart.items.map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <CartSummary cart={cart} onCheckout={handleCheckout} />
            </div>
          </div>
        )}
      </div>

      <CheckoutDialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen} />
    </div>
  );
}
