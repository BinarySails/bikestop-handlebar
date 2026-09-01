import { Logs } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useListSalesOrderAuditLogRequest } from "@/lib/api/api";
import {
  type AuditEventResponse,
  type ListSalesOrderAuditLogRequestParams,
  type SalesOrderId,
  type SalesOrderUpdatedAuditData,
  type SalesOrderUpdatedAuditLine,
  type SalesOrderUpdatedAuditModifiedLine,
} from "@/lib/api/schemas";
import { formatDueDateWithFns } from "@/lib/dates";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  quote: "Cotización",
  confirmed: "Confirmada",
  partially_fulfilled: "Parcialmente despachada",
  fulfilled: "Completamente despachada",
  cancelled: "Cancelada",
  closed: "Cerrada",
};

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const JUST_NOW_SEC = 60;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isUpdatedAuditData(data: unknown): data is SalesOrderUpdatedAuditData {
  return (
    isPlainObject(data) &&
    ("added_lines" in data ||
      "removed_lines" in data ||
      "modified_lines" in data ||
      "grand_total" in data ||
      "line_count" in data ||
      "billing_address" in data ||
      "shipping_address" in data ||
      "payment_term_id" in data)
  );
}

function isAuditLine(value: unknown): value is SalesOrderUpdatedAuditLine {
  return (
    isPlainObject(value) &&
    typeof value.line_id === "string" &&
    typeof value.variant_id === "string" &&
    typeof value.description === "string" &&
    typeof value.quantity === "number" &&
    typeof value.unit_price === "number" &&
    typeof value.line_total === "number"
  );
}

function isModifiedAuditLine(
  value: unknown
): value is SalesOrderUpdatedAuditModifiedLine {
  return (
    isPlainObject(value) &&
    typeof value.line_id === "string" &&
    typeof value.variant_id === "string" &&
    typeof value.description === "string" &&
    "changes" in value
  );
}

function statusLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return STATUS_LABELS[value] ?? value;
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const rawDiffSec = Math.round((date.getTime() - Date.now()) / 1000);

  if (Math.abs(rawDiffSec) < JUST_NOW_SEC) {
    return "hace un momento";
  }

  const absSec = Math.abs(rawDiffSec);
  const pastDiffSec = -absSec;
  const formatter = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

  if (absSec < 3600) {
    return formatter.format(Math.round(pastDiffSec / 60), "minute");
  }
  if (absSec < 86_400) {
    return formatter.format(Math.round(pastDiffSec / 3600), "hour");
  }
  if (absSec < 86_400 * 30) {
    return formatter.format(Math.round(pastDiffSec / 86_400), "day");
  }
  if (absSec < 86_400 * 365) {
    return formatter.format(Math.round(pastDiffSec / (86_400 * 30)), "month");
  }
  return formatter.format(Math.round(pastDiffSec / (86_400 * 365)), "year");
}

function formatAbsolute(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return formatDueDateWithFns(date);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function readPair(value: unknown): { from: unknown; to: unknown } | null {
  if (!isPlainObject(value)) return null;
  if (!("from" in value) || !("to" in value)) return null;
  return { from: value.from, to: value.to };
}

function readChange(
  data: unknown,
  key: string
): string | number | boolean | null | undefined {
  if (!isPlainObject(data)) return undefined;
  const value = data[key];
  if (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  return undefined;
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function describeLineChanges(description: string, changes: unknown): string[] {
  if (!isPlainObject(changes)) return [];
  const out: string[] = [];

  if ("quantity" in changes) {
    const pair = readPair(changes.quantity);
    if (pair && typeof pair.from === "number" && typeof pair.to === "number") {
      out.push(
        `cambió la cantidad de ${description} de ${pair.from} a ${pair.to}`
      );
    }
  }
  if ("unit_price" in changes) {
    const pair = readPair(changes.unit_price);
    if (pair && typeof pair.from === "number" && typeof pair.to === "number") {
      out.push(
        `cambió el precio unitario de ${description} de ${money.format(pair.from / 100)} a ${money.format(pair.to / 100)}`
      );
    }
  }
  if ("discount_amount" in changes) {
    const pair = readPair(changes.discount_amount);
    if (pair && typeof pair.from === "number" && typeof pair.to === "number") {
      out.push(
        `cambió el descuento de ${description} de ${money.format(pair.from / 100)} a ${money.format(pair.to / 100)}`
      );
    }
  }
  if ("description" in changes) {
    const pair = readPair(changes.description);
    if (
      pair &&
      typeof pair.from === "string" &&
      typeof pair.to === "string" &&
      pair.from !== pair.to
    ) {
      out.push(
        `cambió la descripción de la línea de "${truncate(pair.from, 40)}" a "${truncate(pair.to, 40)}"`
      );
    }
  }
  if ("variant_id" in changes) {
    const pair = readPair(changes.variant_id);
    if (
      pair &&
      typeof pair.from === "string" &&
      typeof pair.to === "string" &&
      pair.from !== pair.to
    ) {
      out.push(`cambió la variante de la línea`);
    }
  }

  return out;
}

function summarizeAggregateUpdate(data: SalesOrderUpdatedAuditData): string[] {
  const phrases: string[] = [];

  const grandTotalPair = readPair(data.grand_total);
  const lineCountPair = readPair(data.line_count);
  const fromGT =
    typeof grandTotalPair?.from === "number" ? grandTotalPair.from : null;
  const toGT =
    typeof grandTotalPair?.to === "number" ? grandTotalPair.to : null;
  const fromLC =
    typeof lineCountPair?.from === "number" ? lineCountPair.from : null;
  const toLC = typeof lineCountPair?.to === "number" ? lineCountPair.to : null;

  const grandTotalChanged = fromGT !== null && toGT !== null && fromGT !== toGT;

  if (
    fromLC !== null &&
    toLC !== null &&
    fromLC !== toLC &&
    typeof data.line_count === "object"
  ) {
    const lineDelta = toLC - fromLC;
    let moneySuffix = "";
    if (grandTotalChanged && fromGT !== null && toGT !== null) {
      const valueDelta = Math.abs(toGT - fromGT);
      const sign = lineDelta > 0 ? "+" : "-";
      moneySuffix = ` (${sign}${money.format(valueDelta / 100)})`;
    }
    if (lineDelta > 0) {
      phrases.push(
        `agregó ${lineDelta} ${lineDelta === 1 ? "línea" : "líneas"}${moneySuffix} (${fromLC} → ${toLC})`
      );
    } else {
      const n = Math.abs(lineDelta);
      phrases.push(
        `eliminó ${n} ${n === 1 ? "línea" : "líneas"}${moneySuffix} (${fromLC} → ${toLC})`
      );
    }
  } else if (grandTotalChanged && fromGT !== null && toGT !== null) {
    phrases.push(
      `ajustó el total de ${money.format(fromGT / 100)} a ${money.format(toGT / 100)}`
    );
  }

  for (const [field, raw] of Object.entries(data)) {
    if (field === "grand_total" || field === "line_count") continue;
    const pair = readPair(raw);
    if (!pair) continue;
    if (deepEqual(pair.from, pair.to)) continue;

    switch (field) {
      case "comments":
        phrases.push("actualizó los comentarios");
        break;
      case "customer_id":
        phrases.push("cambió el cliente");
        break;
      case "order_date":
        phrases.push("cambió la fecha de la orden");
        break;
      case "billing_address":
        phrases.push("actualizó la dirección de facturación");
        break;
      case "shipping_address":
        phrases.push("actualizó la dirección de envío");
        break;
      case "payment_term_id":
        phrases.push("cambió el término de pago");
        break;
      default:
        break;
    }
  }

  return phrases;
}

function summarizeUpdate(data: unknown): string[] {
  if (!isUpdatedAuditData(data)) return [];

  const perLine: string[] = [];

  if (Array.isArray(data.added_lines)) {
    for (const raw of data.added_lines) {
      if (!isAuditLine(raw)) continue;
      perLine.push(
        `agregó ${raw.description} (${raw.quantity} × ${money.format(raw.unit_price / 100)})`
      );
    }
  }
  if (Array.isArray(data.removed_lines)) {
    for (const raw of data.removed_lines) {
      if (!isAuditLine(raw)) continue;
      perLine.push(
        `eliminó ${raw.description} (${raw.quantity} × ${money.format(raw.unit_price / 100)})`
      );
    }
  }
  if (Array.isArray(data.modified_lines)) {
    for (const raw of data.modified_lines) {
      if (!isModifiedAuditLine(raw)) continue;
      perLine.push(...describeLineChanges(raw.description, raw.changes));
    }
  }

  if (perLine.length > 0) return perLine;

  return summarizeAggregateUpdate(data);
}

function joinPhrases(phrases: string[]): string {
  if (phrases.length === 1) return phrases[0];
  if (phrases.length === 2) return `${phrases[0]} y ${phrases[1]}`;
  return `${phrases.slice(0, -1).join(", ")} y ${phrases[phrases.length - 1]}`;
}

function describe(event: AuditEventResponse, actorName: string): string {
  switch (event.action) {
    case "sales_order.created": {
      if (isPlainObject(event.data)) {
        const orderNumber =
          typeof event.data.order_number === "string"
            ? event.data.order_number
            : null;
        const lineCount =
          typeof event.data.line_count === "number"
            ? event.data.line_count
            : null;
        const grandTotal =
          typeof event.data.grand_total === "number"
            ? event.data.grand_total
            : null;
        const detail: string[] = [];
        if (orderNumber) detail.push(orderNumber);
        if (lineCount != null) {
          detail.push(`${lineCount} ${lineCount === 1 ? "línea" : "líneas"}`);
        }
        if (grandTotal != null) {
          detail.push(`total ${money.format(grandTotal / 100)}`);
        }
        if (detail.length > 0) {
          return `${actorName} creó la orden (${detail.join(", ")})`;
        }
      }
      return `${actorName} creó la orden`;
    }

    case "sales_order.updated": {
      const phrases = summarizeUpdate(event.data);
      if (phrases.length === 0) return `${actorName} actualizó la orden`;
      return `${actorName} ${joinPhrases(phrases)}`;
    }

    case "sales_order.status_changed": {
      const from = statusLabel(readChange(event.data, "from"));
      const to = statusLabel(readChange(event.data, "to"));
      if (from && to) return `${actorName} cambió el estado de ${from} a ${to}`;
      if (to) return `${actorName} cambió el estado a ${to}`;
      return `${actorName} cambió el estado`;
    }

    case "sales_order.cancelled":
      return `${actorName} canceló la orden`;

    case "sales_order.line_dispatched": {
      const qty = readChange(event.data, "quantity");
      if (typeof qty === "number") {
        return `${actorName} despachó ${qty} ${qty === 1 ? "unidad" : "unidades"} de la línea`;
      }
      return `${actorName} despachó una línea`;
    }

    case "sales_order.commented":
    case "sales_order.comment_added": {
      const comment = readChange(event.data, "comment");
      if (typeof comment === "string" && comment.trim()) {
        return `${actorName} agregó un comentario: "${truncate(comment, 120)}"`;
      }
      return `${actorName} agregó un comentario`;
    }

    case "sales_order.promotions_applied": {
      const prev = readChange(event.data, "previous_grand_total");
      const next = readChange(event.data, "new_grand_total");
      if (typeof prev === "number" && typeof next === "number") {
        return `${actorName} aplicó promociones (${money.format(prev / 100)} → ${money.format(next / 100)})`;
      }
      return `${actorName} aplicó promociones`;
    }

    case "sales_order.tags_changed":
    case "sales_order.tags_updated": {
      if (isPlainObject(event.data)) {
        const added = Array.isArray(event.data.added) ? event.data.added : [];
        const removed = Array.isArray(event.data.removed)
          ? event.data.removed
          : [];
        const phrases: string[] = [];
        if (added.length > 0) {
          phrases.push(
            `agregó ${added.length} ${added.length === 1 ? "etiqueta" : "etiquetas"}`
          );
        }
        if (removed.length > 0) {
          phrases.push(
            `eliminó ${removed.length} ${removed.length === 1 ? "etiqueta" : "etiquetas"}`
          );
        }
        if (phrases.length > 0) {
          return `${actorName} actualizó las etiquetas (${phrases.join(", ")})`;
        }
      }
      return `${actorName} actualizó las etiquetas`;
    }

    default:
      return `${actorName} ${event.action}`;
  }
}

function TimelineRow({ event }: { event: AuditEventResponse }) {
  const actorName = event.actor?.name ?? "Sistema";
  const description = describe(event, actorName);

  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      <span aria-hidden className="flex w-3 shrink-0 flex-col items-center">
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground ring-4 ring-background" />
        <span className="mt-1 w-px flex-1 bg-border last:hidden" />
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-0.5 text-sm">
        <span className="text-foreground">{description}</span>
        <TooltipProvider delay={150}>
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="ml-auto cursor-default text-xs whitespace-nowrap text-muted-foreground" />
              }
            >
              {formatRelative(event.occurred_at)}
            </TooltipTrigger>
            <TooltipContent>{formatAbsolute(event.occurred_at)}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </li>
  );
}

function TimelineSkeleton() {
  return (
    <ul aria-label="Cargando historial" className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <li key={index} className="flex gap-3">
          <Skeleton className="mt-3 size-2 rounded-full" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="ml-auto h-3 w-12" />
        </li>
      ))}
    </ul>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="space-y-2 py-6 text-center">
      <p className="text-sm font-medium">No se pudo cargar el historial.</p>
      <p className="text-xs text-muted-foreground">
        Intenta de nuevo en unos momentos.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}

export function SalesOrderAuditLog({ orderId }: { orderId: SalesOrderId }) {
  const params: ListSalesOrderAuditLogRequestParams = {
    page: 0,
    limit: 20,
  };

  const { data, isLoading, error, mutate } = useListSalesOrderAuditLogRequest(
    orderId,
    params,
    { swr: { keepPreviousData: true } }
  );

  const events = data?.status === 200 ? data.data.data : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Logs className="size-4" />
          Historial de cambios
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && events.length === 0 ? (
          <TimelineSkeleton />
        ) : error ? (
          <ErrorState onRetry={() => void mutate()} />
        ) : events.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sin actividad registrada.
          </p>
        ) : (
          <ul className="list-none pl-0">
            {events.map((event) => (
              <TimelineRow key={event.id} event={event} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
