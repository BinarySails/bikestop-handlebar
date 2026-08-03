import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/warehouses/")({
  component: WarehousesIndexPage,
});

function WarehousesIndexPage() {
  return <section aria-label="Almacenes" />;
}
