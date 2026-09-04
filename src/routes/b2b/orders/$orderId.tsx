import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { ProductLineThumbnail } from "@/components/features/sales/product-line-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useGetMySaleOrderRequest } from "@/lib/api/api";
import type { SalesOrder, SalesOrderStatus } from "@/lib/api/schemas";
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

const statusBadgeVariant: Record<
  SalesOrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  quote: "outline",
  confirmed: "default",
  partially_fulfilled: "default",
  fulfilled: "default",
  cancelled: "destructive",
  closed: "secondary",
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "long",
});

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const DISPATCH_TRACKED_STATUSES: SalesOrderStatus[] = [
  "confirmed",
  "partially_fulfilled",
  "fulfilled",
];

function formatMoney(cents: number) {
  return currencyFormatter.format(centsToPesos(cents));
}

export const Route = createFileRoute("/b2b/orders/$orderId")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const { data: orderRes, isLoading } = useGetMySaleOrderRequest(orderId);

  const order = orderRes?.status === 200 ? orderRes.data : null;

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col p-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Cargando pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col p-4 py-6 sm:px-6">
        <BackButton />
        <p className="text-sm text-muted-foreground">
          No se encontró el pedido.
        </p>
      </div>
    );
  }

  const dueDate = computeDueDate(
    order.order_date,
    order.payment_term.days_until_due ?? null
  );
  const showDispatch = DISPATCH_TRACKED_STATUSES.includes(order.status);
  const totalUnits = order.lines.reduce((sum, line) => sum + line.quantity, 0);
  const dispatchedUnits = order.lines.reduce(
    (sum, line) => sum + line.dispatched_quantity,
    0
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col p-4 py-6 sm:px-6">
      <BackButton />

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Pedido {order.order_number}
        </h1>
        <Badge variant={statusBadgeVariant[order.status]}>
          {statusLabel[order.status]}
        </Badge>
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        Realizado el {dateFormatter.format(new Date(order.order_date))}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <SummaryRow label="Artículos" value={String(order.lines.length)} />
            <SummaryRow label="Unidades" value={String(totalUnits)} />
            <SummaryRow
              label="Término de pago"
              value={order.payment_term.name}
            />
            {dueDate && (
              <SummaryRow label="Vence el" value={formatDueDate(dueDate)} />
            )}
            {showDispatch && (
              <SummaryRow
                label="Despachado"
                value={`${dispatchedUnits} / ${totalUnits} uds.`}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Dirección de facturación
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <AddressBlock address={order.billing_address} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dirección de envío</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <AddressBlock address={order.shipping_address} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Productos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.lines.map((line) => {
            const pending = Math.max(
              line.quantity - line.dispatched_quantity,
              0
            );
            const dispatchPct =
              line.quantity > 0
                ? Math.round((line.dispatched_quantity / line.quantity) * 100)
                : 0;

            return (
              <div
                key={line.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start"
              >
                <ProductLineThumbnail
                  productId={line.product_id}
                  variantId={line.variant_id}
                  alt={line.description}
                />

                <div className="flex-1 space-y-3">
                  <p className="font-medium text-foreground">
                    {line.description}
                  </p>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                    <Field label="Cantidad" value={String(line.quantity)} />
                    <Field
                      label="Precio unitario"
                      value={formatMoney(line.unit_price)}
                    />
                    <Field label="IVA" value={`${line.tax_rate / 100}%`} />
                    <Field
                      label="Total línea"
                      value={formatMoney(line.line_total)}
                      strong
                    />
                  </div>

                  {line.discount_amount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Descuento aplicado: −{formatMoney(line.discount_amount)}
                    </p>
                  )}

                  {showDispatch && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Despachado {line.dispatched_quantity} de{" "}
                          {line.quantity}
                          {pending > 0 ? ` · ${pending} pendiente(s)` : ""}
                        </span>
                        <span>{dispatchPct}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${dispatchPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <Separator />

          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(order.subtotal)}</span>
              </div>
              {order.discount_total > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Descuento</span>
                  <span>−{formatMoney(order.discount_total)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impuestos</span>
                <span>{formatMoney(order.tax_total)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span>{formatMoney(order.grand_total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {order.comments && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Comentarios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {order.comments}
            </p>
          </CardContent>
        </Card>
      )}

      {order.tags.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Etiquetas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {order.tags.map((tag) => (
                <Badge key={tag.id} variant="outline">
                  {tag.display_name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BackButton() {
  return (
    <Button
      render={<Link to="/b2b/orders" />}
      nativeButton={false}
      variant="ghost"
      size="sm"
      className="mb-2 -ml-2 self-start"
    >
      <ArrowLeft />
      Volver a mis pedidos
    </Button>
  );
}

function AddressBlock({ address }: { address: SalesOrder["billing_address"] }) {
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function Field({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={strong ? "font-semibold text-foreground" : "text-foreground"}
      >
        {value}
      </p>
    </div>
  );
}
