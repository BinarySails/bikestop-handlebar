import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Package } from "lucide-react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";

import { ApplyPromotionsDialog } from "@/components/features/sales/apply-promotions-dialog";
import { CreateSalesOrderForm } from "@/components/features/sales/create-sales-order-form";
import { SalesOrderAuditLog } from "@/components/features/sales/sales-order-audit-log";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getListSalesOrderAuditLogRequestKey,
  useAddSalesOrderCommentRequest,
  useGetSaleOrderRequest,
  useMeHandler,
  usePickFulfillmentOrderRequest,
  useReleaseFulfillmentRequest,
} from "@/lib/api/api";
import {
  cancelSalesOrderRequest,
  confirmSalesOrderRequest,
  dispatchSalesOrderLineRequest,
  updateSalesOrderStatusRequest,
} from "@/lib/api/sales-order-actions";
import { updateSalesOrderRequest } from "@/lib/api/update-sales-order";
import {
  FulfillState,
  SalesOrderStatus,
  type SalesOrder,
  type SalesOrderLineId,
  type WarehouseId,
} from "@/lib/api/schemas";
import { computeDueDate, formatDueDate } from "@/lib/dates";

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

export const Route = createFileRoute("/admin/sales/$orderId/")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const [applyPromotionsOpen, setApplyPromotionsOpen] = useState(false);
  const { data: sessionResponse } = useMeHandler();
  const {
    data: response,
    error,
    isLoading,
    mutate,
  } = useGetSaleOrderRequest(orderId);
  const { trigger: addComment } = useAddSalesOrderCommentRequest(orderId);
  const { mutate: swrMutate } = useSWRConfig();
  const auditKey = getListSalesOrderAuditLogRequestKey(orderId, {
    page: 0,
    limit: 20,
  });
  const revalidateAudit = () => {
    void swrMutate(auditKey);
  };
  const { trigger: pickOrder, isMutating: isPickingOrder } =
    usePickFulfillmentOrderRequest();
  const { trigger: releaseOrder, isMutating: isReleasingOrder } =
    useReleaseFulfillmentRequest(orderId);

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

  const currentOrderId = order.id;
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

  const currentUserId = sessionUser?.id;
  const isOrderPicked = order.fulfill_state === FulfillState.picked;
  const isPickedByCurrentUser =
    isOrderPicked && order.fulfilling_user_id === currentUserId;
  const canPickOrder =
    !isOrderPicked &&
    (order.status === SalesOrderStatus.confirmed ||
      order.status === SalesOrderStatus.partially_fulfilled);

  async function handlePickOrder() {
    const result = await pickOrder({ order_id: orderId });
    if (result?.status === 200) {
      toast.success(
        `Orden ${result.data.order_number} seleccionada para despacho.`
      );
      await mutate();
    } else if (result?.status === 404) {
      toast.error("No hay órdenes disponibles para despacho.");
    } else if (result?.status === 409) {
      toast.error("Ya tienes una orden seleccionada para despacho.");
    } else {
      toast.error("Error al seleccionar la orden.");
    }
  }

  async function handleReleaseOrder() {
    const result = await releaseOrder(currentOrderId);
    if (result?.status === 200) {
      toast.success("Orden liberada.");
      await mutate();
    } else {
      toast.error("Error al liberar la orden.");
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="outline" size="sm" render={<Link to="/admin/sales" />}>
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
          <PaymentTermSummary order={order} />
        </div>
        {isOrderPicked && isPickedByCurrentUser && (
          <>
            <Badge className="border-yellow-300 bg-yellow-100 text-yellow-800">
              <Package className="mr-1 size-3" />
              Tu orden para despachar
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReleaseOrder}
              disabled={isReleasingOrder}
            >
              Liberar
            </Button>
          </>
        )}
        {!isOrderPicked && canPickOrder && (
          <Button
            size="sm"
            onClick={handlePickOrder}
            disabled={isPickingOrder}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            <Package className="mr-1 size-4" />
            Despachar este pedido
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
          revalidateAudit();
        }}
        onSaveOrder={async (payload) => {
          const updated = await updateSalesOrderRequest(order.id, payload);
          if (
            (updated.status !== 200 && updated.status !== 201) ||
            !("id" in updated.data)
          ) {
            const message =
              "message" in updated.data ? updated.data.message : undefined;
            throw new Error(
              updated.status === 409 &&
                "type" in updated.data &&
                updated.data.type ===
                  "create_sales_order_error_insufficient_stock"
                ? "Stock insuficiente para una o más asignaciones de almacén."
                : (message ?? "No se pudo actualizar la orden")
            );
          }

          if (updated.status === 201 || updated.data.id !== order.id) {
            await navigate({
              to: "/admin/sales/$orderId",
              params: { orderId: updated.data.id },
            });
            return;
          }

          await mutate(
            { status: 200, data: updated.data, headers: new Headers() },
            { revalidate: false }
          );
          revalidateAudit();
        }}
        onAdvance={async () => {
          const updated = await updateSalesOrderStatusRequest(order.id);
          if (updated.status !== 200) {
            throw new Error(
              updated.data.message ?? "No se pudo cambiar el estado de la orden"
            );
          }
          await mutate(updated, { revalidate: false });
          revalidateAudit();
        }}
        onConfirm={async () => {
          const updated = await confirmSalesOrderRequest(order.id);
          if (updated.status !== 200) {
            throw new Error(
              updated.data.message ?? "No se pudo confirmar la orden"
            );
          }
          await mutate(updated, { revalidate: false });
        }}
        onCancel={async () => {
          const updated = await cancelSalesOrderRequest(order.id);
          if (updated.status !== 200) {
            throw new Error("No se pudo cancelar la orden");
          }
          await mutate(updated, { revalidate: false });
          revalidateAudit();
        }}
        onDispatchLine={async (
          lineId: SalesOrderLineId,
          warehouseId: WarehouseId,
          quantity: number
        ) => {
          const result = await dispatchSalesOrderLineRequest(order.id, lineId, {
            warehouse_id: warehouseId,
            quantity,
          });
          if (result.status !== 201) {
            throw new Error(
              result.data.message ?? "No se pudo despachar la línea"
            );
          }
          await mutate();
          revalidateAudit();
        }}
        onApplyPromotions={() => setApplyPromotionsOpen(true)}
      />

      <ApplyPromotionsDialog
        order={order}
        open={applyPromotionsOpen}
        onOpenChange={setApplyPromotionsOpen}
        onApplied={async () => {
          await mutate();
          revalidateAudit();
        }}
      />

      <SalesOrderAuditLog orderId={order.id} />
    </section>
  );
}

function PaymentTermSummary({ order }: { order: SalesOrder }) {
  const dueDate = computeDueDate(
    order.order_date,
    order.payment_term.days_until_due ?? null
  );

  return (
    <p className="mt-1 text-sm text-muted-foreground">
      Término de pago:{" "}
      <span className="font-medium text-foreground">
        {order.payment_term.name}
      </span>
      {dueDate ? <span> · Vence el {formatDueDate(dueDate)}</span> : null}
    </p>
  );
}
