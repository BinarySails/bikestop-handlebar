import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";

import { CartDrawer } from "@/components/features/catalog/cart-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetCart } from "@/lib/cart/use-cart";

export function CatalogHeader() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: cartRes } = useGetCart();

  const cartItemCount =
    cartRes?.status === 200 ? cartRes.data.item_count : 0;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          className="text-lg font-bold"
          onClick={() => navigate({ to: "/" })}
        >
          BikeStop
        </Button>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm">
            Productos
          </Button>

          <Button
            size="sm"
            className="relative bg-amber-500 text-black hover:bg-amber-600"
            onClick={() => setDrawerOpen(true)}
          >
            <ShoppingCart className="size-4" />
            <span className="ml-2 hidden sm:inline">Carrito</span>
            {cartItemCount > 0 && (
              <Badge
                variant="secondary"
                className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full p-0 text-xs"
              >
                {cartItemCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <CartDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </header>
  );
}
