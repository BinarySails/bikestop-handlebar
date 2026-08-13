import useSwr from "swr";

import type { ProductInventoryItem } from "@/components/features/products/product-inventory-table";
import { listInventoryRequest } from "@/lib/api/api";
import type { Variant } from "@/lib/api/schemas";

export type UseProductInventoryResult = {
  items: ProductInventoryItem[];
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
};

export function useProductInventory(
  productId: string,
  variants: Variant[] | undefined
): UseProductInventoryResult {
  const sortedVariantIds = [...(variants ?? [])]
    .map((variant) => variant.id)
    .sort();

  const swrKey =
    sortedVariantIds.length > 0
      ? (["product-inventory", productId, ...sortedVariantIds] as const)
      : null;

  const { data, error, isLoading, mutate } = useSwr<ProductInventoryItem[]>(
    swrKey,
    async () => {
      const currentVariants = variants ?? [];
      if (currentVariants.length === 0) {
        return [];
      }

      const responses = await Promise.all(
        currentVariants.map((variant) =>
          listInventoryRequest({ variant_id: variant.id })
        )
      );

      const items: ProductInventoryItem[] = [];

      for (let index = 0; index < currentVariants.length; index++) {
        const variant = currentVariants[index];
        const response = responses[index];

        if (response.status !== 200) {
          throw new Error("Error al cargar el inventario.");
        }

        for (const inventoryItem of response.data) {
          items.push({
            sku: variant.sku,
            nombre: inventoryItem.variant_name,
            imagen: inventoryItem.variant_image_url,
            almacen: inventoryItem.warehouse_name,
            cantidad: inventoryItem.total_quantity,
          });
        }
      }

      return items;
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
