import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

import { CreateSalesOrderForm } from "@/components/features/sales/create-sales-order-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  cancelSalesOrderRequest,
  updateSalesOrderRequest,
  updateSalesOrderStatusRequest,
  useAddSalesOrderCommentRequest,
  useGetSaleOrderRequest,
  useMeHandler,
} from "@/lib/api/api";
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

const statusVariant: Record<
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

export const Route = createFileRoute("/_layout/sales/$orderId/")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const { data: sessionResponse } = useMeHandler();
  const {
    data: response,
    error,
    isLoading,
    mutate,
  } = useGetSaleOrderRequest(orderId);
  const { trigger: addComment } = useAddSalesOrderCommentRequest(orderId);

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-7xl space-y-6 p-6">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </section>
    );
  }

  const order = response?.status === 200 ? response.data : null;

  if (error || !order) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No se encontró la orden de venta o ocurrió un error al cargarla.
        </p>
      </main>
    );
  }

  const sessionUser =
    sessionResponse?.status === 200 ? sessionResponse.data : null;
  const commentAuthor = sessionUser
    ? [
        sessionUser.name,
        sessionUser.father_last_name,
        sessionUser.mother_last_name,
      ]
        .filter(Boolean)
        .join(" ")
    : "Usuario";

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="outline" size="sm" render={<Link to="/sales" />}>
          <ChevronLeft className="size-4" />
          Regresar
        </Button>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {order.status === "quote" ? "Cotización" : "Orden de venta"}{" "}
              {order.order_number}
            </h1>
            <Badge variant={statusVariant[order.status]}>
              {statusLabel[order.status]}
            </Badge>
          </div>
        </div>
      </div>

      <CreateSalesOrderForm
        order={order}
        commentAuthor={commentAuthor}
        onAddComment={async (comment) => {
          const updated = await addComment({ comment });
          if (updated.status !== 200) {
            throw new Error("No se pudo agregar el comentario");
          }
          await mutate(updated, { revalidate: false });
        }}
        onSaveOrder={async (payload) => {
          const updated = await updateSalesOrderRequest(order.id, payload);
          if (
            (updated.status !== 200 && updated.status !== 201) ||
            !("id" in updated.data)
          ) {
            throw new Error("No se pudo actualizar la orden");
          }

          if (updated.status === 201 || updated.data.id !== order.id) {
            await navigate({
              to: "/sales/$orderId",
              params: { orderId: updated.data.id },
            });
            return;
          }

          await mutate(
            { status: 200, data: updated.data, headers: updated.headers },
            { revalidate: false }
          );
        }}
        onAdvance={async () => {
          const updated = await updateSalesOrderStatusRequest(order.id);
          if (updated.status !== 200) {
            throw new Error("No se pudo cambiar el estado de la orden");
          }
          await mutate(updated, { revalidate: false });
        }}
        onCancel={async () => {
          const updated = await cancelSalesOrderRequest(order.id);
          if (updated.status !== 200) {
            throw new Error("No se pudo cancelar la orden");
          }
          await mutate(updated, { revalidate: false });
        }}
      />
    </section>
  );
}
