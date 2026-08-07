import { createFileRoute, useNavigate } from "@tanstack/react-router";

import {
  OrderDetail,
  type OrderDetailData,
} from "@/components/features/sales/order-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetSaleOrderRequest } from "@/lib/api/api";
import type { AddressSnapshot, SalesOrder } from "@/lib/api/schemas";

export const Route = createFileRoute("/_layout/sales/$orderId/")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const { data: response, error, isLoading } = useGetSaleOrderRequest(orderId);

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

  return (
    <OrderDetail
      order={detail}
      onBack={() => navigate({ to: "/sales" })}
      onOpenPaymentsAndInvoices={() =>
        navigate({
          to: "/sales/$orderId/payments-invoices",
          params: { orderId },
        })
      }
    />
  );
}

function formatAddress(address: AddressSnapshot) {
  return [
    address.address,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function toOrderDetail(order: SalesOrder): OrderDetailData {
  const taxableBase = Math.max(0, order.subtotal - order.discount_total);

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
    shipping: {
      carrier: "",
      address: formatAddress(order.shipping_address),
      estimatedDelivery: "",
    },
    discount: order.discount_total,
    taxRate: taxableBase > 0 ? order.tax_total / taxableBase : 0,
    subtotal: order.subtotal,
    taxTotal: order.tax_total,
    grandTotal: order.grand_total,
    notes: order.comments ?? "",
    payments: [],
    invoices: [],
  };
}
