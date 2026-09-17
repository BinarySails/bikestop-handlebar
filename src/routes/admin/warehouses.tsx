import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/warehouses")({
  component: WarehousesLayout,
});

function WarehousesLayout() {
  return <Outlet />;
}
