import useSwr from "swr";

import { listInventoryRequest } from "@/lib/api/api";
import type { InventoryItemResponse } from "@/lib/api/schemas";

export type VariantInventoryItem = {
  almacen: string;
  sku: string;
  nombre: string;
  imagen: string;
  cantidad: number;
};

export type UseVariantInventoryResult = {
  items: VariantInventoryItem[];
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
};

export function useVariantInventory(
  variantId: string | undefined
): UseVariantInventoryResult {
  const swrKey = variantId
    ? (["variant-inventory", variantId] as const)
    : null;

  const { data, error, isLoading, mutate } = useSwr<VariantInventoryItem[]>(
    swrKey,
    async () => {
      if (!variantId) {
        return [];
      }

      const response = await listInventoryRequest({ variant_id: variantId });

      if (response.status !== 200) {
        throw new Error("Error al cargar el inventario.");
      }

      return response.data.map((item: InventoryItemResponse) => ({
        almacen: item.warehouse_name,
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
