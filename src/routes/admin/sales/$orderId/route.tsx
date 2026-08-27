import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/sales/$orderId")({
  component: OrderLayout,
});

function OrderLayout() {
  return <Outlet />;
}
