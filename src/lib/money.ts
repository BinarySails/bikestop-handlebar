export function pesosToCents(amount: number): number {
  return Math.round(amount * 100);
}

export function centsToPesos(cents: number): number {
  return cents / 100;
}

export function centsToPesosString(cents: number): string {
  return (cents / 100).toFixed(2);
}
