import { useCallback, useMemo, useState } from "react";
import { Loader2, Tag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { listActivePromotionsRequest } from "@/lib/api/api";
import type { Promotion } from "@/lib/api/schemas";
import type { Cart } from "@/lib/cart/use-cart";
import { centsToPesos } from "@/lib/money";

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
  }).format(centsToPesos(amount));
}

function calculateDiscount(promo: Promotion, subtotal: number): number {
  const method = promo.application_method;
  if ("Standard" in method) {
    const { target, value } = method.Standard;
    if ("percentage" in value) {
      return Math.round((subtotal * value.percentage) / 100);
    }
    if ("fixed_amount" in value) {
      const fixed = value.fixed_amount as unknown as [number, string];
      const amount = fixed[0] ?? 0;
      if (target === "order") return amount;
      return Math.min(amount, subtotal);
    }
  }
  return 0;
}

function describeDiscount(promo: Promotion): string {
  const method = promo.application_method;
  const inner = "Standard" in method ? method.Standard : method.BuyGet;
  const val = inner.value;
  if ("percentage" in val) {
    return `${val.percentage}% de descuento`;
  }
  if ("fixed_amount" in val) {
    const fixed = val.fixed_amount as unknown as [number, string];
    return `${formatPrice(fixed[0] ?? 0, fixed[1] ?? "MXN")} de descuento`;
  }
  return "Descuento aplicado";
}

function isPromotionValid(promo: Promotion): boolean {
  if (promo.status !== "active") return false;
  if (promo.is_automatic) return false;
  const now = new Date();
  if (promo.starts_at && new Date(promo.starts_at) > now) return false;
  if (promo.ends_at && new Date(promo.ends_at) < now) return false;
  if (promo.usage_limit != null && promo.used_count >= promo.usage_limit)
    return false;
  return true;
}

interface CartSummaryProps {
  cart: Cart;
  onCheckout?: (promoCodes: string[]) => void;
}

export function CartSummary({ cart, onCheckout }: CartSummaryProps) {
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromos, setAppliedPromos] = useState<string[]>([]);
  const [validatedPromos, setValidatedPromos] = useState<
    Record<string, Promotion>
  >({});
  const [isValidating, setIsValidating] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const handleApplyPromo = useCallback(async () => {
    const code = promoInput.trim();
    if (!code) return;
    if (appliedPromos.includes(code)) return;

    setIsValidating(true);
    setPromoError(null);

    try {
      const res = await listActivePromotionsRequest();

      if (res.status !== 200) {
        setPromoError("Error al validar el código de descuento");
        return;
      }

      const match = res.data.find(
        (p) => p.code.toLowerCase() === code.toLowerCase()
      );

      if (!match) {
        setPromoError("Código de descuento no válido");
        return;
      }

      if (!isPromotionValid(match)) {
        setPromoError("Código de descuento no disponible");
        return;
      }

      setAppliedPromos((prev) => [...prev, code]);
      setValidatedPromos((prev) => ({ ...prev, [code]: match }));
      setPromoInput("");
      toast.success(`Código ${code} aplicado`);
    } catch {
      setPromoError("Error al conectar con el servidor");
    } finally {
      setIsValidating(false);
    }
  }, [promoInput, appliedPromos]);

  function handleRemovePromo(code: string) {
    setAppliedPromos((prev) => prev.filter((c) => c !== code));
    setValidatedPromos((prev) => {
      const next = { ...prev };
      delete next[code];
      return next;
    });
  }

  const totalDiscount = useMemo(() => {
    return appliedPromos.reduce((sum, code) => {
      const promo = validatedPromos[code];
      if (!promo) return sum;
      return sum + calculateDiscount(promo, cart.subtotal);
    }, 0);
  }, [appliedPromos, validatedPromos, cart.subtotal]);

  const adjustedTotal = cart.grand_total - totalDiscount;

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
            {appliedPromos.map((code) => {
              const promo = validatedPromos[code];
              const discount = promo
                ? calculateDiscount(promo, cart.subtotal)
                : 0;
              return (
                <div key={code} className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <Tag className="size-3" />
                    {code}
                    {promo && (
                      <span className="text-muted-foreground">
                        ({describeDiscount(promo)})
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {discount > 0 && (
                      <span className="text-xs text-green-600">
                        -{formatPrice(discount, cart.currency)}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePromo(code)}
                      className="h-auto p-0 text-xs text-destructive"
                    >
                      Quitar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Descuento</span>
            <span className="text-green-600">
              -{formatPrice(totalDiscount, cart.currency)}
            </span>
          </div>
        )}

        {promoError && <p className="text-xs text-destructive">{promoError}</p>}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Código de descuento"
          value={promoInput}
          onChange={(e) => {
            setPromoInput(e.target.value);
            if (promoError) setPromoError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApplyPromo();
            }
          }}
          disabled={isValidating}
          className="h-8 text-sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleApplyPromo}
          disabled={!promoInput.trim() || isValidating}
        >
          {isValidating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Aplicar"
          )}
        </Button>
      </div>

      <Separator />

      <div className="flex justify-between text-sm font-semibold">
        <span>Total</span>
        <span>
          {totalDiscount > 0
            ? formatPrice(adjustedTotal, cart.currency)
            : formatPrice(cart.grand_total, cart.currency)}
        </span>
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
