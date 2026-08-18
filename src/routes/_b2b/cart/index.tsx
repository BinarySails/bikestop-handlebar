import { useNavigate, createFileRoute } from "@tanstack/react-router";
import { Loader2, ShoppingCart } from "lucide-react";

import { CartItemRow } from "@/components/features/catalog/cart-item-row";
import { CartSummary } from "@/components/features/catalog/cart-summary";
import { Separator } from "@/components/ui/separator";
import { useGetCart, useClearCart } from "@/lib/cart/use-cart";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_b2b/cart/")({
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();
  const { data: cartRes, isLoading, error } = useGetCart();
  const { trigger: clearCart, isMutating: isClearing } = useClearCart();

  const cart =
    cartRes?.status === 200 ? cartRes.data : null;

  function handleCheckout(promoCodes: string[]) {
    console.log("Checkout with promo codes:", promoCodes);
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
              {isClearing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Vaciar carrito
            </Button>
          )}
        </div>

        <Separator />

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : error || !cart || cart.item_count === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border py-16">
            <ShoppingCart className="size-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              Tu carrito está vacío
            </p>
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/catalog" })}
            >
              Ver productos
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="rounded-lg border p-4">
                  <CartItemRow item={item} />
                </div>
              ))}
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <CartSummary
                cart={cart}
                onCheckout={handleCheckout}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
