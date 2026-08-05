import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/warehouses")({
  component: WarehousesLayout,
});

function WarehousesLayout() {
  return <Outlet />;
}
