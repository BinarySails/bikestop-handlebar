export function pesosToCents(amount: number): number {
  return Math.round(amount * 100);
}

export function centsToPesos(cents: number): number {
  return cents / 100;
}

export function centsToPesosString(cents: number): string {
  return (cents / 100).toFixed(2);
}

type PriceLike = { amount: number; currency: string; price_type: string };

export function resolvePrice<T extends PriceLike>(
  defaultPrice: T | null | undefined,
  prices: T[] | undefined
): T | undefined {
  return (
    defaultPrice ??
    prices?.find((p) => p.price_type === "regular") ??
    prices?.[0]
  );
}
