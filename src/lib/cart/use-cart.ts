import { useCallback, useEffect, useState } from "react";
import useSwr, { useSWRConfig } from "swr";

import {
  addToCartHandler,
  clearCartHandler,
  getCartHandler,
  getGetCartHandlerKey,
  removeCartItemHandler,
  updateCartItemHandler,
  type getCartHandlerResponse,
} from "@/lib/api/api";
import type {
  CartItemResponse,
  CatalogProduct,
  GetCartResponse,
} from "@/lib/api/schemas";
import { getOrCreateCartId } from "@/lib/cart/use-cart-id";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CartItem = CartItemResponse;
export type Cart = GetCartResponse;

// ---------------------------------------------------------------------------
// Cart id (client side, persisted in localStorage)
// ---------------------------------------------------------------------------

export function useCartId(): string | null {
  const [cartId, setCartId] = useState<string | null>(null);

  useEffect(() => {
    setCartId(getOrCreateCartId());
  }, []);

  return cartId;
}

// ---------------------------------------------------------------------------
// Hooks (backend cart)
// ---------------------------------------------------------------------------

export function useGetCart(): {
  data: getCartHandlerResponse | undefined;
  isLoading: boolean;
} {
  const cartId = useCartId();
  const swrKey = cartId ? getGetCartHandlerKey({ cart_id: cartId }) : null;

  const { data, isLoading } = useSwr<getCartHandlerResponse>(
    swrKey,
    () => getCartHandler({ cart_id: cartId as string }),
    { revalidateOnFocus: false }
  );

  return { data, isLoading };
}

export function useCartMutate() {
  const cartId = useCartId();
  const { mutate } = useSWRConfig();

  return useCallback(() => {
    if (cartId) {
      void mutate(getGetCartHandlerKey({ cart_id: cartId }));
    }
  }, [cartId, mutate]);
}

export function useUpdateCartItem() {
  const [isMutating, setIsMutating] = useState(false);
  const cartMutate = useCartMutate();

  const trigger = useCallback(
    async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      setIsMutating(true);
      try {
        const res = await updateCartItemHandler(itemId, { quantity });
        if (res.status !== 200) {
          throw new Error("Error al actualizar el carrito.");
        }
        cartMutate();
        return res;
      } finally {
        setIsMutating(false);
      }
    },
    [cartMutate]
  );

  return { trigger, isMutating };
}

export function useDeleteCartItem() {
  const [isMutating, setIsMutating] = useState(false);
  const cartMutate = useCartMutate();

  const trigger = useCallback(
    async ({ itemId }: { itemId: string }) => {
      setIsMutating(true);
      try {
        const res = await removeCartItemHandler(itemId);
        if (res.status !== 204) {
          throw new Error("Error al eliminar del carrito.");
        }
        cartMutate();
        return res;
      } finally {
        setIsMutating(false);
      }
    },
    [cartMutate]
  );

  return { trigger, isMutating };
}

export function useAddToCart() {
  const [isMutating, setIsMutating] = useState(false);
  const cartMutate = useCartMutate();

  const trigger = useCallback(
    async ({
      product,
      quantity,
    }: {
      product: CatalogProduct;
      quantity: number;
    }) => {
      const cartId = getOrCreateCartId();
      if (!cartId) {
        throw new Error("Carrito no disponible.");
      }

      setIsMutating(true);
      try {
        const res = await addToCartHandler({
          cart_id: cartId,
          variant_id: product.id,
          quantity,
        });
        if (res.status !== 201) {
          throw new Error("Error al agregar al carrito.");
        }
        cartMutate();
        return res;
      } finally {
        setIsMutating(false);
      }
    },
    [cartMutate]
  );

  return { trigger, isMutating };
}

export function useClearCart() {
  const [isMutating, setIsMutating] = useState(false);
  const cartMutate = useCartMutate();

  const trigger = useCallback(async () => {
    const cartId = getOrCreateCartId();

    setIsMutating(true);
    try {
      if (cartId) {
        const res = await clearCartHandler({ cart_id: cartId });
        if (res.status !== 204) {
          throw new Error("Error al vaciar el carrito.");
        }
      }
      cartMutate();
      return { status: 204 as const };
    } finally {
      setIsMutating(false);
    }
  }, [cartMutate]);

  return { trigger, isMutating };
}
