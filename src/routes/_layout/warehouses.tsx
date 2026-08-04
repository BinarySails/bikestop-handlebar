import { createFileRoute, Outlet } from "@tanstack/react-router";

import { CreateWarehouseDialog } from "@/components/features/warehouses/create-warehouse-modal";

export const Route = createFileRoute("/_layout/warehouses")({
  component: LocationsPage,
});

function LocationsPage() {
  return (
    <section aria-label="Almacenes" className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Almacenes</h1>
        <CreateWarehouseDialog />
      </div>
      <Outlet />
    </section>
  );
}
