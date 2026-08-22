import { useState } from "react";
import { Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { Cart } from "@/lib/cart/use-cart";
import { centsToPesos } from "@/lib/money";

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
  }).format(centsToPesos(amount));
}

interface CartSummaryProps {
  cart: Cart;
  onCheckout?: (promoCodes: string[]) => void;
}

export function CartSummary({ cart, onCheckout }: CartSummaryProps) {
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromos, setAppliedPromos] = useState<string[]>([]);

  function handleApplyPromo() {
    const code = promoInput.trim();
    if (!code) return;
    if (appliedPromos.includes(code)) return;
    setAppliedPromos((prev) => [...prev, code]);
    setPromoInput("");
  }

  function handleRemovePromo(code: string) {
    setAppliedPromos((prev) => prev.filter((c) => c !== code));
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <h2 className="text-base font-semibold">Resumen del pedido</h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Artículos ({cart.item_count})
          </span>
          <span>{formatPrice(cart.subtotal, cart.currency)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">
            IVA ({cart.tax_rate / 100}%)
          </span>
          <span>{formatPrice(cart.tax_total, cart.currency)}</span>
        </div>

        {appliedPromos.length > 0 && (
          <div className="space-y-1">
            {appliedPromos.map((code) => (
              <div key={code} className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <Tag className="size-3" />
                  {code}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemovePromo(code)}
                  className="h-auto p-0 text-xs text-destructive"
                >
                  Quitar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Código de descuento"
          value={promoInput}
          onChange={(e) => setPromoInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApplyPromo();
            }
          }}
          className="h-8 text-sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleApplyPromo}
          disabled={!promoInput.trim()}
        >
          Aplicar
        </Button>
      </div>

      <Separator />

      <div className="flex justify-between text-sm font-semibold">
        <span>Total</span>
        <span>{formatPrice(cart.grand_total, cart.currency)}</span>
      </div>

      <Button
        className="w-full bg-amber-500 text-black hover:bg-amber-600"
        onClick={() => onCheckout?.(appliedPromos)}
        disabled={cart.item_count === 0}
      >
        Continuar
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Incluye IVA ({cart.tax_rate / 100}%)
      </p>
    </div>
  );
}
