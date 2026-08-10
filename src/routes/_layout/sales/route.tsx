import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/sales")({
  component: SalesLayout,
});

function SalesLayout() {
  return <Outlet />;
}
