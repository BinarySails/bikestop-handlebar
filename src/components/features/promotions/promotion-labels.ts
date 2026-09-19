import type { Promotion } from "@/lib/api/schemas";
import { centsToPesosString } from "@/lib/money";

export function promotionKind(promotion: Promotion): string {
  const method = promotion.application_method;
  if ("BuyGet" in method) return "Compra X obtén Y";
  const target = method.Standard.target;
  const isFixed = "fixed_amount" in method.Standard.value;
  if (target === "order") {
    return isFixed ? "Monto en la orden" : "Porcentaje en la orden";
  }
  return isFixed ? "Monto en productos" : "Porcentaje en productos";
}

export function discountValueLabel(promotion: Promotion): string {
  const method = promotion.application_method;
  const value =
    "Standard" in method ? method.Standard.value : method.BuyGet.value;
  if ("percentage" in value) {
    return `${(value.percentage / 100).toFixed(0)}%`;
  }
  const fixed = value.fixed_amount as unknown as [number, string];
  return `$${centsToPesosString(fixed[0] ?? 0)} ${fixed[1] ?? ""}`;
}
