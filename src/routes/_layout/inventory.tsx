import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/features/layout/site-header";
import { InventoryTable } from "@/components/features/inventory/inventory-table";
import {
  useListProductsRequest,
  useListWarehousesRequest,
} from "@/lib/api/api";
import { useInventory } from "@/lib/api/use-inventory";
import type { Product, WarehouseResponse } from "@/lib/api/schemas";

export const Route = createFileRoute("/_layout/inventory")({
  component: InventoryPage,
});

function InventoryPage() {
  const { data: productsResponse, isLoading: isLoadingProducts } =
    useListProductsRequest(undefined, {
      swr: {
        revalidateOnFocus: false,
      },
    });
  const { data: warehousesResponse, isLoading: isLoadingWarehouses } =
    useListWarehousesRequest(undefined, {
      swr: {
        revalidateOnFocus: false,
      },
    });

  const products: Product[] =
    productsResponse?.status === 200 ? productsResponse.data.data : [];
  const warehouses: WarehouseResponse[] =
    warehousesResponse?.status === 200 ? warehousesResponse.data : [];

  const {
    items: inventoryItems,
    isLoading: inventoryLoading,
    error: inventoryError,
    mutate: mutateInventory,
  } = useInventory();

  return (
    <>
      <SiteHeader
        title="Inventario"
        description="Consulta el inventario y los movimientos de existencias en BikeStop."
      />
      <main className="flex flex-1 flex-col gap-6 p-6">
        <InventoryTable
          products={products}
          warehouses={warehouses}
          items={inventoryItems}
          loading={inventoryLoading || isLoadingProducts || isLoadingWarehouses}
          error={inventoryError}
          onRetry={() => mutateInventory()}
          onAddSuccess={() => mutateInventory()}
        />
      </main>
    </>
  );
}
