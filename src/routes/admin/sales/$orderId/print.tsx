import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";

import { SalesOrderPrintDocument } from "@/components/features/sales/sales-order-print-document";
import { Button } from "@/components/ui/button";
import { useGetSaleOrderRequest } from "@/lib/api/api";

export const Route = createFileRoute("/admin/sales/$orderId/print")({
  validateSearch: (search: Record<string, unknown>) => ({
    autoprint:
      search.autoprint === true ||
      search.autoprint === "1" ||
      search.autoprint === "true",
  }),
  component: OrderPrintPage,
});

function OrderPrintPage() {
  const { orderId } = Route.useParams();
  const { autoprint } = Route.useSearch();
  const { data: orderRes, isLoading } = useGetSaleOrderRequest(orderId);
  const order = orderRes?.status === 200 ? orderRes.data : null;

  // Set a print-friendly document title so the browser's "save as PDF" and the
  // print header default to the order number instead of the app name.
  useEffect(() => {
    if (!order) return;
    const previous = document.title;
    document.title = `Pedido ${order.order_number}`;
    return () => {
      document.title = previous;
    };
  }, [order]);

  // When opened via the "Imprimir" button (?autoprint), open the browser
  // print dialog as soon as the order has loaded, then close the tab once
  // printing finishes so the user stays on the detail page.
  useEffect(() => {
    if (!autoprint || !order) return;
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, [autoprint, order]);

  useEffect(() => {
    if (!autoprint) return;
    const close = () => window.close();
    window.addEventListener("afterprint", close);
    return () => window.removeEventListener("afterprint", close);
  }, [autoprint]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <p className="text-sm text-muted-foreground">Cargando pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <Button
          render={<Link to="/admin/sales" />}
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="-ml-2"
        >
          <ArrowLeft />
          Volver a ventas
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">
          No se encontró el pedido.
        </p>
      </div>
    );
  }

  return (
    <div className="print-document mx-auto w-full max-w-3xl p-4 py-6 text-foreground sm:p-8">
      <div className="no-print mb-6 flex items-center justify-between gap-3">
        <Button
          render={
            <Link to="/admin/sales/$orderId" params={{ orderId: order.id }} />
          }
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="-ml-2"
        >
          <ArrowLeft />
          Volver al pedido
        </Button>
        <Button type="button" size="sm" onClick={() => window.print()}>
          <Printer className="size-4" />
          Imprimir
        </Button>
      </div>

      <SalesOrderPrintDocument order={order} />
    </div>
  );
}
