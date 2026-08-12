import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetSaleOrderRequest } from "@/lib/api/api";

export const Route = createFileRoute(
  "/_layout/sales/$orderId/payments-invoices"
)({
  component: PaymentsAndInvoicesPage,
});

function PaymentsAndInvoicesPage() {
  const { orderId } = Route.useParams();
  const { data: response, error, isLoading } = useGetSaleOrderRequest(orderId);

  if (isLoading) {
    return <Skeleton className="m-8 h-64 rounded-xl" />;
  }

  const order = response?.status === 200 ? response.data : null;

  if (order?.status === "quote") {
    return <Navigate to="/sales/$orderId" params={{ orderId }} replace />;
  }

  if (error || !order) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          No se encontró la orden de venta o ocurrió un error al cargarla.
        </p>
      </main>
    );
  }

  return (
    <main className="w-full p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex items-center gap-4">
        <Button
          variant="outline"
          size="icon-lg"
          className="rounded-full"
          aria-label="Volver al pedido"
          render={<Link to="/sales/$orderId" params={{ orderId }} />}
        >
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            PAGOS Y FACTURAS
          </h1>
          <p className="text-sm text-muted-foreground">Pedido #{orderId}</p>
        </div>
      </header>

      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No hay datos de pagos o facturas disponibles. Conecta esta ruta al
          servicio correspondiente para mostrar la información del pedido.
        </p>
      </div>
    </main>
  );
}
