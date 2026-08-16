import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";

export function computeDueDate(
  orderDateIso: string,
  daysUntilDue: number | null | undefined
): Date | null {
  if (daysUntilDue == null) return null;
  const orderDate = new Date(orderDateIso);
  if (Number.isNaN(orderDate.getTime())) return null;
  return addDays(orderDate, daysUntilDue);
}

const dueDateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
});

export function formatDueDate(date: Date): string {
  return dueDateFormatter.format(date);
}

export function formatDueDateWithFns(date: Date): string {
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: es });
}
