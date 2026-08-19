import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CatalogProduct } from "@/lib/api/schemas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LocalCartItem = {
  id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  currency: string;
  display_name: string;
  sku: string;
  prices: { amount: number; currency: string; price_type: string }[];
  properties: { property_name: string; property_value: string }[];
  images: { image_url: string }[];
  line_total: number;
};

export type LocalCart = {
  id: string;
  currency: string;
  item_count: number;
  items: LocalCartItem[];
  subtotal: number;
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface LocalCartState {
  items: LocalCartItem[];
  addItem: (product: CatalogProduct, quantity: number) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
}

function computeCart(items: LocalCartItem[]): LocalCart {
  const subtotal = items.reduce((sum, i) => sum + i.line_total, 0);
  const item_count = items.reduce((sum, i) => sum + i.quantity, 0);
  return {
    id: "local-cart",
    currency: "MXN",
    item_count,
    items,
    subtotal,
  };
}

export const useLocalCartStore = create<LocalCartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem(product: CatalogProduct, quantity: number) {
        const { items } = get();
        const existing = items.find((i) => i.variant_id === product.id);

        const price =
          product.default_price ??
          product.prices.find((p) => p.price_type === "regular");
        const unitPrice = price?.amount ?? 0;
        const currency = price?.currency ?? "MXN";

        if (existing) {
          const updated = items.map((i) =>
            i.variant_id === product.id
              ? {
                  ...i,
                  quantity: i.quantity + quantity,
                  line_total: (i.quantity + quantity) * i.unit_price,
                }
              : i
          );
          set({ items: updated });
        } else {
          const newItem: LocalCartItem = {
            id: crypto.randomUUID(),
            variant_id: product.id,
            quantity,
            unit_price: unitPrice,
            currency,
            display_name: product.display_name,
            sku: product.sku,
            prices: product.prices.map((p) => ({
              amount: p.amount,
              currency: p.currency,
              price_type: p.price_type,
            })),
            properties: product.properties.map((p) => ({
              property_name: p.property_name,
              property_value: p.property_value,
            })),
            images: product.images.map((img) => ({
              image_url: img.image_url,
            })),
            line_total: quantity * unitPrice,
          };
          set({ items: [...items, newItem] });
        }
      },

      updateItemQuantity(itemId: string, quantity: number) {
        if (quantity < 1) return;
        set({
          items: get().items.map((i) =>
            i.id === itemId
              ? { ...i, quantity, line_total: quantity * i.unit_price }
              : i
          ),
        });
      },

      removeItem(itemId: string) {
        set({ items: get().items.filter((i) => i.id !== itemId) });
      },

      clearCart() {
        set({ items: [] });
      },
    }),
    { name: "bikestop-local-cart" }
  )
);

// ---------------------------------------------------------------------------
// Convenience selector
// ---------------------------------------------------------------------------

export function useLocalCart(): LocalCart {
  const items = useLocalCartStore((s) => s.items);
  return computeCart(items);
}
