import { createFileRoute, useNavigate } from "@tanstack/react-router";

import {
  OrderDetail,
  type OrderDetailData,
} from "@/components/features/sales/order-detail";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAddSalesOrderCommentRequest,
  useGetSaleOrderRequest,
  useMeHandler,
} from "@/lib/api/api";
import type { SalesOrder } from "@/lib/api/schemas";

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
      <main className="space-y-8 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </main>
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

  const detail = toOrderDetail(order);
  const sessionUser =
    sessionResponse?.status === 200 ? sessionResponse.data.user : null;
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
    <OrderDetail
      order={detail}
      commentAuthor={commentAuthor}
      onBack={() => navigate({ to: "/sales" })}
      onOpenPaymentsAndInvoices={() =>
        navigate({
          to: "/sales/$orderId/payments-invoices",
          params: { orderId },
        })
      }
      onAddComment={async (comment) => {
        const updated = await addComment({ comment });
        if (updated.status !== 200) {
          throw new Error("No se pudo agregar el comentario");
        }
        await mutate(updated, { revalidate: false });
      }}
    />
  );
}

function toOrderDetail(order: SalesOrder): OrderDetailData {
  const taxRates = new Set(order.lines.map((line) => line.tax_rate));
  const taxableBase = Math.max(0, order.subtotal - order.discount_total);
  const taxRate =
    taxRates.size === 1
      ? (order.lines[0]?.tax_rate ?? 0) / 100
      : taxableBase > 0
        ? (order.tax_total / taxableBase) * 100
        : 0;

  return {
    folio: order.order_number,
    status: order.status,
    products: order.lines.map((line) => ({
      id: line.id,
      sku: line.variant_id,
      name: line.description,
      quantity: line.quantity,
      unitPrice: line.unit_price,
    })),
    customer: {
      id: order.customer.customer_id,
      name: order.customer.name,
    },
    discount: order.discount_total,
    taxRate,
    subtotal: order.subtotal,
    taxTotal: order.tax_total,
    grandTotal: order.grand_total,
    notes: order.comments ?? "",
    payments: [],
    invoices: [],
  };
}
