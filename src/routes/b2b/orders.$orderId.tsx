import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetSaleOrderRequest } from "@/lib/api/api";
import { centsToPesos } from "@/lib/money";
import type { SalesOrderStatus } from "@/lib/api/schemas";

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
  dateStyle: "medium",
});

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export const Route = createFileRoute("/b2b/orders/$orderId")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const { data: orderRes, isLoading } = useGetSaleOrderRequest(orderId);

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
        <p className="text-sm text-muted-foreground">
          No se encontró el pedido.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col p-4 py-6 sm:px-6">
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

      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Pedido {order.order_number}
        </h1>
        <Badge variant={statusBadgeVariant[order.status]}>
          {statusLabel[order.status]}
        </Badge>
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        {dateFormatter.format(new Date(order.order_date))}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Dirección de facturación
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{order.billing_address.country}</p>
            <p>
              {order.billing_address.state}, {order.billing_address.city}
            </p>
            <p>{order.billing_address.postal_code}</p>
            <p>{order.billing_address.address}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dirección de envío</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{order.shipping_address.country}</p>
            <p>
              {order.shipping_address.state}, {order.shipping_address.city}
            </p>
            <p>{order.shipping_address.postal_code}</p>
            <p>{order.shipping_address.address}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio unitario</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <p className="font-medium">{line.description}</p>
                  </TableCell>
                  <TableCell className="text-right">{line.quantity}</TableCell>
                  <TableCell className="text-right">
                    {currencyFormatter.format(centsToPesos(line.unit_price))}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {currencyFormatter.format(centsToPesos(line.line_total))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>
                  {currencyFormatter.format(centsToPesos(order.subtotal))}
                </span>
              </div>
              {order.discount_total > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Descuento</span>
                  <span>
                    -
                    {currencyFormatter.format(
                      centsToPesos(order.discount_total)
                    )}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impuestos</span>
                <span>
                  {currencyFormatter.format(centsToPesos(order.tax_total))}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span>
                  {currencyFormatter.format(centsToPesos(order.grand_total))}
                </span>
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

      <div className="mt-6 text-sm text-muted-foreground">
        <p>
          Término de pago:{" "}
          <span className="font-medium text-foreground">
            {order.payment_term.name}
          </span>
        </p>
      </div>
    </div>
  );
}
