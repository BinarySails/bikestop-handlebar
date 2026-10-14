import { useEffect, useMemo, useState } from "react";

import { getPromotionRequest } from "@/lib/api/api";
import type {
  AddressSnapshot,
  Promotion,
  SalesOrderLineAdjustment,
  SalesOrder,
  SalesOrderStatus,
} from "@/lib/api/schemas";
import { computeDueDate, formatDueDate } from "@/lib/dates";
import { centsToPesos } from "@/lib/money";

const statusLabel: Record<SalesOrderStatus, string> = {
  draft: "Borrador",
  quote: "Cotización",
  confirmed: "Confirmada",
  partially_fulfilled: "Parcialmente despachada",
  fulfilled: "Completamente despachada",
  cancelled: "Cancelada",
  closed: "Cerrada",
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "long" });

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function formatMoney(cents: number) {
  return currencyFormatter.format(centsToPesos(cents));
}

function promotionDiscountLabel(promotion: Promotion): string {
  const value =
    "Standard" in promotion.application_method
      ? promotion.application_method.Standard.value
      : promotion.application_method.BuyGet.value;
  if ("percentage" in value) {
    const percentage = new Intl.NumberFormat("es-MX", {
      maximumFractionDigits: 2,
    }).format(value.percentage / 100);
    return `${percentage}%`;
  }

  const [amount, currency] = value.fixed_amount as unknown as [number, string];
  const formatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency || "MXN",
  });
  return `Monto fijo ${formatter.format(centsToPesos(amount ?? 0))}`;
}

function adjustmentLabel(
  adjustment: SalesOrderLineAdjustment,
  promotions: Map<string, Promotion>
): string {
  if (!("Promotion" in adjustment.source)) {
    return adjustment.description || "Descuento manual";
  }
  const { code, promotion_id: promotionId } = adjustment.source.Promotion;
  const promotion = promotions.get(promotionId);
  return promotion ? `${code} · ${promotionDiscountLabel(promotion)}` : code;
}

function orderDiscountBreakdown(
  order: SalesOrder,
  promotions: Map<string, Promotion>
): { key: string; label: string; amount: number }[] {
  const totals = new Map<string, { label: string; amount: number }>();
  for (const line of order.lines) {
    for (const adjustment of line.adjustments) {
      if (adjustment.amount <= 0) continue;
      const key =
        "Promotion" in adjustment.source
          ? `promotion:${adjustment.source.Promotion.promotion_id}`
          : `manual:${adjustment.description ?? ""}`;
      const label = adjustmentLabel(adjustment, promotions);
      const current = totals.get(key);
      totals.set(key, {
        label: current?.label ?? label,
        amount: (current?.amount ?? 0) + adjustment.amount,
      });
    }
  }

  const details = [...totals].map(([key, value]) => ({ key, ...value }));
  const detailedDiscount = details.reduce((sum, item) => sum + item.amount, 0);
  const unitemizedAmount = order.discount_total - detailedDiscount;
  if (unitemizedAmount > 0) {
    details.push({
      key: "unitemized",
      label: "Otros descuentos",
      amount: unitemizedAmount,
    });
  }
  return details;
}

export function SalesOrderPrintDocument({ order }: { order: SalesOrder }) {
  const promotionIds = useMemo(
    () => [
      ...new Set(
        order.lines.flatMap((line) =>
          line.adjustments.flatMap((adjustment) =>
            "Promotion" in adjustment.source
              ? [adjustment.source.Promotion.promotion_id]
              : []
          )
        )
      ),
    ],
    [order.lines]
  );
  const promotionIdsKey = promotionIds.join(":");
  const [promotions, setPromotions] = useState<Map<string, Promotion>>(
    new Map()
  );

  useEffect(() => {
    let cancelled = false;
    const ids = promotionIdsKey ? promotionIdsKey.split(":") : [];
    if (ids.length === 0) {
      setPromotions(new Map());
      return;
    }

    void Promise.all(
      ids.map(async (id) => {
        try {
          const response = await getPromotionRequest(id);
          return response.status === 200
            ? ([id, response.data] as const)
            : null;
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (!cancelled) {
        const loaded = new Map<string, Promotion>();
        for (const result of results) {
          if (result) loaded.set(result[0], result[1]);
        }
        setPromotions(loaded);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [promotionIdsKey]);

  const dueDate = computeDueDate(
    order.order_date,
    order.payment_term.days_until_due ?? null
  );
  const totalUnits = order.lines.reduce((sum, line) => sum + line.quantity, 0);
  const discounts = orderDiscountBreakdown(order, promotions);

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-lg font-bold tracking-tight">BikeStop</p>
          <p className="text-sm text-muted-foreground">Pedido</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold tracking-tight">
            {order.order_number}
          </p>
          <p className="text-sm text-muted-foreground">
            {statusLabel[order.status]}
          </p>
          <p className="text-sm text-muted-foreground">
            {dateFormatter.format(new Date(order.order_date))}
          </p>
        </div>
      </header>

      <section className="grid gap-6 py-6 sm:grid-cols-2">
        <div>
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Cliente
          </h2>
          <p className="mt-1 font-medium">{order.customer.name}</p>
          <div className="mt-2 text-sm text-muted-foreground">
            <AddressLines address={order.billing_address} />
          </div>
        </div>
        <div>
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Dirección de envío
          </h2>
          <div className="mt-1 text-sm text-muted-foreground">
            <AddressLines address={order.shipping_address} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 border-y py-4 text-sm sm:grid-cols-4">
        <Meta label="Fecha del pedido">
          {dateFormatter.format(new Date(order.order_date))}
        </Meta>
        <Meta label="Término de pago">{order.payment_term.name}</Meta>
        {dueDate && <Meta label="Vence el">{formatDueDate(dueDate)}</Meta>}
        <Meta label="Unidades">{String(totalUnits)}</Meta>
      </section>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
            <th className="py-2 pr-2 font-semibold">#</th>
            <th className="py-2 pr-2 font-semibold">Descripción</th>
            <th className="py-2 pr-2 text-right font-semibold">Cant.</th>
            <th className="py-2 pr-2 text-right font-semibold">P. unitario</th>
            <th className="py-2 pr-2 text-right font-semibold">IVA</th>
            <th className="py-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line) => (
            <tr key={line.id} className="break-inside-avoid border-b align-top">
              <td className="py-2 pr-2 text-muted-foreground">
                {line.line_number}
              </td>
              <td className="py-2 pr-2">
                {line.description}
                {line.discount_amount > 0 && (
                  <div className="mt-0.5 space-y-0.5 text-xs text-muted-foreground">
                    {line.adjustments.some(
                      (adjustment) => adjustment.amount > 0
                    )
                      ? line.adjustments
                          .filter((adjustment) => adjustment.amount > 0)
                          .map((adjustment) => (
                            <span key={adjustment.id} className="block">
                              {adjustmentLabel(adjustment, promotions)}: −
                              {formatMoney(adjustment.amount)}
                            </span>
                          ))
                      : `Descuento aplicado: −${formatMoney(line.discount_amount)}`}
                  </div>
                )}
              </td>
              <td className="py-2 pr-2 text-right">{line.quantity}</td>
              <td className="py-2 pr-2 text-right">
                {formatMoney(line.unit_price)}
              </td>
              <td className="py-2 pr-2 text-right">{line.tax_rate / 100}%</td>
              <td className="py-2 text-right font-medium">
                {formatMoney(line.line_total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatMoney(order.subtotal)}</span>
          </div>
          {order.discount_total > 0 && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Descuentos aplicados
                </span>
                <span>−{formatMoney(order.discount_total)}</span>
              </div>
              {discounts.map((discount) => (
                <div
                  key={discount.key}
                  className="flex justify-between gap-3 pl-3 text-xs text-muted-foreground"
                >
                  <span>{discount.label}</span>
                  <span className="shrink-0">
                    −{formatMoney(discount.amount)}
                  </span>
                </div>
              ))}
            </>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Impuestos</span>
            <span>{formatMoney(order.tax_total)}</span>
          </div>
          <div className="flex justify-between border-t pt-1 text-base font-semibold">
            <span>Total</span>
            <span>{formatMoney(order.grand_total)}</span>
          </div>
        </div>
      </div>

      {order.comments && (
        <section className="mt-6 border-t pt-4">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Comentarios
          </h2>
          <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">
            {order.comments}
          </p>
        </section>
      )}

      <footer className="mt-8 border-t pt-4 text-xs text-muted-foreground">
        Documento generado desde BikeStop el {dateFormatter.format(new Date())}.
      </footer>
    </>
  );
}

function AddressLines({ address }: { address: AddressSnapshot }) {
  return (
    <div className="space-y-0.5">
      <p>{address.address}</p>
      <p>
        {address.city}, {address.state}
      </p>
      <p>{address.postal_code}</p>
      <p>{address.country}</p>
    </div>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{children}</p>
    </div>
  );
}
