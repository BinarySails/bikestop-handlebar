import useSwr from "swr";

import { listInventoryRequest } from "@/lib/api/api";
import type { InventoryItemResponse } from "@/lib/api/schemas";

export type WarehouseInventoryItem = {
  sku: string;
  nombre: string;
  imagen: string;
  cantidad: number;
};

export type UseWarehouseInventoryResult = {
  items: WarehouseInventoryItem[];
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
};

export function useWarehouseInventory(
  warehouseId: string | undefined
): UseWarehouseInventoryResult {
  const swrKey = warehouseId
    ? (["warehouse-inventory", warehouseId] as const)
    : null;

  const { data, error, isLoading, mutate } = useSwr<WarehouseInventoryItem[]>(
    swrKey,
    async () => {
      if (!warehouseId) {
        return [];
      }

      const response = await listInventoryRequest({ warehouse_id: warehouseId });

      if (response.status !== 200) {
        throw new Error("Error al cargar el inventario.");
      }

      return response.data.map((item: InventoryItemResponse) => ({
        sku: item.variant_sku,
        nombre: item.variant_name,
        imagen: item.variant_image_url,
        cantidad: item.total_quantity,
      }));
    },
    {
      revalidateOnFocus: false,
    }
  );

  return {
    items: data ?? [],
    isLoading,
    error: error ? "Error al cargar el inventario." : null,
    mutate,
  };
}
