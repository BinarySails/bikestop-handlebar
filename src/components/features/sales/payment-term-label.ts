const PAYMENT_TERM_NAME_LABELS: Record<string, string> = {
  "Pago inmediato": "Pago de contado",
};

export function formatPaymentTermName(name: string | null | undefined): string {
  if (!name) return "";
  return PAYMENT_TERM_NAME_LABELS[name] ?? name;
}
