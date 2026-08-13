import useSwr from "swr";

import { listInventoryRequest } from "@/lib/api/api";
import type { InventoryItemResponse } from "@/lib/api/schemas";

export type InventoryItem = {
  almacen: string;
  sku: string;
  nombre: string;
  cantidad: number;
};

export type UseInventoryResult = {
  items: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
};

export function useInventory(): UseInventoryResult {
  const swrKey = ["inventory"] as const;

  const { data, error, isLoading, mutate } = useSwr<InventoryItem[]>(
    swrKey,
    async () => {
      const response = await listInventoryRequest();

      if (response.status !== 200) {
        throw new Error("Error al cargar el inventario.");
      }

      return response.data.map((item: InventoryItemResponse) => ({
        almacen: item.warehouse_name,
        sku: item.variant_sku,
        nombre: item.variant_name,
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
