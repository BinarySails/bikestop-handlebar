import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/sales")({
  component: SalesPage,
});

function SalesPage() {
  return <Outlet />;
}
