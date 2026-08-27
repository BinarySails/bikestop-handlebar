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
import { useListAuditEventsRequest } from "@/lib/api/api";
import {
  type AuditEventResponse,
  type ListAuditEventsRequestParams,
  type SalesOrderId,
  type SalesOrderLine,
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

function findMatchingLine(
  lines: SalesOrderLine[],
  targetCents: number
): SalesOrderLine | undefined {
  return lines.find((l) => l.line_total === targetCents);
}

function summarizeUpdate(
  data: unknown,
  knownLines?: SalesOrderLine[]
): string[] {
  if (!isPlainObject(data)) return [];

  const grandTotalPair = readPair(data.grand_total);
  const lineCountPair = readPair(data.line_count);

  const fromGT =
    typeof grandTotalPair?.from === "number" ? grandTotalPair.from : null;
  const toGT =
    typeof grandTotalPair?.to === "number" ? grandTotalPair.to : null;
  const fromLC =
    typeof lineCountPair?.from === "number" ? lineCountPair.from : null;
  const toLC = typeof lineCountPair?.to === "number" ? lineCountPair.to : null;

  const lineCountChanged = fromLC !== null && toLC !== null && fromLC !== toLC;
  const grandTotalChanged = fromGT !== null && toGT !== null && fromGT !== toGT;

  const phrases: string[] = [];

  if (lineCountChanged && fromLC !== null && toLC !== null) {
    const lineDelta = toLC - fromLC;
    let moneySuffix = "";
    let matchedDescription: string | null = null;

    if (grandTotalChanged && fromGT !== null && toGT !== null) {
      const valueDelta = Math.abs(toGT - fromGT);
      const sign = lineDelta > 0 ? "+" : "-";
      moneySuffix = ` (${sign}${money.format(valueDelta / 100)})`;

      if (lineDelta > 0 && knownLines) {
        const match = findMatchingLine(knownLines, valueDelta);
        if (match) matchedDescription = match.description;
      }
    }

    if (lineDelta > 0) {
      const descPart = matchedDescription ? `: ${matchedDescription}` : "";
      phrases.push(
        `agregó ${lineDelta} ${lineDelta === 1 ? "línea" : "líneas"}${descPart}${moneySuffix} (${fromLC} → ${toLC})`
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
      default:
        break;
    }
  }

  return phrases;
}

function describe(
  event: AuditEventResponse,
  actorName: string,
  knownLines?: SalesOrderLine[]
): string {
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
      const phrases = summarizeUpdate(event.data, knownLines);
      if (phrases.length === 0) return `${actorName} actualizó la orden`;
      if (phrases.length === 1) return `${actorName} ${phrases[0]}`;
      return `${actorName} ${phrases[0]} y ${phrases.slice(1).join(", ")}`;
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

function TimelineRow({
  event,
  knownLines,
}: {
  event: AuditEventResponse;
  knownLines?: SalesOrderLine[];
}) {
  const actorName = event.actor?.name ?? "Sistema";
  const description = describe(event, actorName, knownLines);

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

export function SalesOrderAuditLog({
  orderId,
  knownLines,
}: {
  orderId: SalesOrderId;
  knownLines?: SalesOrderLine[];
}) {
  const params: ListAuditEventsRequestParams = {
    entity_type: "sales_order",
    entity_id: orderId,
    page: 0,
    limit: 20,
  };

  const { data, isLoading, error, mutate } = useListAuditEventsRequest(params, {
    swr: { keepPreviousData: true },
  });

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
              <TimelineRow
                key={event.id}
                event={event}
                knownLines={knownLines}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
