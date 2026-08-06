import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/sales/$orderId")({
  component: OrderLayout,
});

function OrderLayout() {
  return <Outlet />;
}
