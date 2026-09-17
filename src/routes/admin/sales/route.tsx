import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/sales")({
  component: SalesLayout,
});

function SalesLayout() {
  return <Outlet />;
}
