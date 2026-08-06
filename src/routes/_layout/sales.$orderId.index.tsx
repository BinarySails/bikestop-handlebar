import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_layout/sales/$orderId/")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { orderId } = Route.useParams();

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div>
        <h1 className="text-xl font-semibold">Pedido #{orderId}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No hay datos del pedido disponibles. Conecta esta ruta al servicio de
          pedidos para mostrar el detalle.
        </p>
      </div>
      <Button variant="outline" render={<Link to="/sales" />}>
        Volver a pedidos
      </Button>
    </main>
  );
}
