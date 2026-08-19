import { useCallback, useState } from "react";

import type { CatalogProduct } from "@/lib/api/schemas";
import {
  useLocalCart,
  useLocalCartStore,
} from "@/lib/cart/use-local-cart-store";

// ---------------------------------------------------------------------------
// Types (kept for compatibility)
// ---------------------------------------------------------------------------

export type CartItemPrice = {
  id: string;
  variant_id: string;
  amount: number;
  currency: string;
  price_type: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type CartItemImage = {
  id: string;
  variant_id: string;
  file_id: string;
  image_url: string;
  image_index: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type CartItemProperty = {
  id: string;
  variant_id: string;
  property_name: string;
  property_value: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type CartItem = {
  id: string;
  variant_id: string;
  cart_id: string;
  quantity: number;
  unit_price: number;
  currency: string;
  display_name: string;
  sku: string;
  prices: CartItemPrice[];
  properties: CartItemProperty[];
  images: CartItemImage[];
  line_total: number;
};

export type Cart = {
  id: string;
  currency: string;
  item_count: number;
  items: CartItem[];
  subtotal: number;
};

export type AddToCartResponse = {
  cart_id: string;
  item: CartItem;
};

export type CartResponse =
  | { data: Cart; status: 200; headers: Headers }
  | { data: void; status: 404; headers: Headers };

// ---------------------------------------------------------------------------
// Hooks (local cart, no backend)
// ---------------------------------------------------------------------------

export function useGetCart(): {
  data: CartResponse | undefined;
  isLoading: boolean;
} {
  const cart = useLocalCart();

  const response: CartResponse =
    cart.item_count > 0
      ? { data: cart as Cart, status: 200, headers: new Headers() }
      : { data: undefined, status: 404, headers: new Headers() };

  return { data: response, isLoading: false };
}

export function useCartMutate() {
  return useCallback(() => {}, []);
}

export function useUpdateCartItem() {
  const [isMutating, setIsMutating] = useState(false);
  const updateItemQuantity = useLocalCartStore((s) => s.updateItemQuantity);

  const trigger = useCallback(
    async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      setIsMutating(true);
      try {
        updateItemQuantity(itemId, quantity);
        return { status: 200 };
      } finally {
        setIsMutating(false);
      }
    },
    [updateItemQuantity]
  );

  return { trigger, isMutating };
}

export function useDeleteCartItem() {
  const [isMutating, setIsMutating] = useState(false);
  const removeItem = useLocalCartStore((s) => s.removeItem);

  const trigger = useCallback(
    async ({ itemId }: { itemId: string }) => {
      setIsMutating(true);
      try {
        removeItem(itemId);
        return { status: 200 };
      } finally {
        setIsMutating(false);
      }
    },
    [removeItem]
  );

  return { trigger, isMutating };
}

export function useAddToCart() {
  const [isMutating, setIsMutating] = useState(false);
  const addItem = useLocalCartStore((s) => s.addItem);

  const trigger = useCallback(
    async ({
      product,
      quantity,
    }: {
      product: CatalogProduct;
      quantity: number;
    }) => {
      setIsMutating(true);
      try {
        addItem(product, quantity);
        return { status: 200, data: { cart_id: "local-cart", item: null } };
      } finally {
        setIsMutating(false);
      }
    },
    [addItem]
  );

  return { trigger, isMutating };
}

export function useClearCart() {
  const [isMutating, setIsMutating] = useState(false);
  const clearCart = useLocalCartStore((s) => s.clearCart);

  const trigger = useCallback(async () => {
    setIsMutating(true);
    try {
      clearCart();
      return { status: 200 };
    } finally {
      setIsMutating(false);
    }
  }, [clearCart]);

  return { trigger, isMutating };
}
