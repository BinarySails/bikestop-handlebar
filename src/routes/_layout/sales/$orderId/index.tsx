import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

import { CreateSalesOrderForm } from "@/components/features/sales/create-sales-order-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAddSalesOrderCommentRequest,
  useGetSaleOrderRequest,
  useMeHandler,
} from "@/lib/api/api";
import { updateSalesOrderRequest } from "@/lib/api/update-sales-order";

export const Route = createFileRoute("/_layout/sales/$orderId/")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { orderId } = Route.useParams();
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
          <h1 className="text-2xl font-semibold tracking-tight">
            {order.status === "quote" ? "Cotización" : "Orden de venta"}{" "}
            {order.order_number}
          </h1>
        </div>
        {order.status === "quote" && (
          <Button type="button" className="ml-auto">
            Convertir en orden de compra
          </Button>
        )}
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
        onSaveDraft={async (payload) => {
          if (order.status !== "draft") return;
          const updated = await updateSalesOrderRequest(order.id, payload);
          if (updated.status !== 200 || !("id" in updated.data)) {
            throw new Error("No se pudo actualizar la orden");
          }
          await mutate(
            { status: 200, data: updated.data, headers: new Headers() },
            { revalidate: false }
          );
        }}
      />
    </section>
  );
}
