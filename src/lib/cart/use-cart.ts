import { useCallback, useEffect, useRef, useState } from "react";
import useSwr, { useSWRConfig } from "swr";

import {
  addToCartHandler,
  checkoutCartHandler,
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
  CheckoutCartRequest,
  GetCartResponse,
} from "@/lib/api/schemas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CartItem = CartItemResponse;
export type Cart = GetCartResponse;

/**
 * Payload del checkout: el backend deduce el customer_id de la sesión,
 * usa "Due on receipt" como término de pago y la fecha actual.
 */
export type CheckoutCartPayload = CheckoutCartRequest;

// ---------------------------------------------------------------------------
// Hooks (backend cart)
// ---------------------------------------------------------------------------

export function useGetCart(): {
  data: getCartHandlerResponse | undefined;
  isLoading: boolean;
} {
  const swrKey = getGetCartHandlerKey();

  const { data, isLoading } = useSwr<getCartHandlerResponse>(
    swrKey,
    () => getCartHandler(),
    { revalidateOnFocus: false }
  );

  return { data, isLoading };
}

export function useCartMutate() {
  const { mutate } = useSWRConfig();

  return useCallback(
    (next?: getCartHandlerResponse) => {
      if (next) {
        void mutate(getGetCartHandlerKey(), next, { revalidate: false });
      } else {
        void mutate(getGetCartHandlerKey());
      }
    },
    [mutate]
  );
}

export function useUpdateCartItem() {
  const [isMutating, setIsMutating] = useState(false);
  const cartMutate = useCartMutate();
  const cartMutateRef = useRef(cartMutate);
  useEffect(() => {
    cartMutateRef.current = cartMutate;
  }, [cartMutate]);

  const trigger = useCallback(
    async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      setIsMutating(true);
      try {
        const res = await updateCartItemHandler(itemId, { quantity });
        if (res.status !== 200) {
          throw new Error("Error al actualizar el carrito.");
        }
        cartMutateRef.current();
        return res;
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  return { trigger, isMutating };
}

export function useDeleteCartItem() {
  const [isMutating, setIsMutating] = useState(false);
  const cartMutate = useCartMutate();
  const cartMutateRef = useRef(cartMutate);
  useEffect(() => {
    cartMutateRef.current = cartMutate;
  }, [cartMutate]);

  const trigger = useCallback(async ({ itemId }: { itemId: string }) => {
    setIsMutating(true);
    try {
      const res = await removeCartItemHandler(itemId);
      if (res.status !== 204) {
        throw new Error("Error al eliminar del carrito.");
      }
      cartMutateRef.current();
      return res;
    } finally {
      setIsMutating(false);
    }
  }, []);

  return { trigger, isMutating };
}

export function useAddToCart() {
  const [isMutating, setIsMutating] = useState(false);
  const cartMutate = useCartMutate();
  const cartMutateRef = useRef(cartMutate);
  useEffect(() => {
    cartMutateRef.current = cartMutate;
  }, [cartMutate]);

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
        const res = await addToCartHandler({
          variant_id: product.id,
          quantity,
        });
        if (res.status !== 201) {
          throw new Error("Error al agregar al carrito.");
        }
        cartMutateRef.current();
        return res;
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  return { trigger, isMutating };
}

export function useClearCart() {
  const [isMutating, setIsMutating] = useState(false);
  const cartMutate = useCartMutate();
  const cartMutateRef = useRef(cartMutate);
  useEffect(() => {
    cartMutateRef.current = cartMutate;
  }, [cartMutate]);

  const trigger = useCallback(async () => {
    setIsMutating(true);
    try {
      const res = await clearCartHandler();
      if (res.status !== 204) {
        throw new Error("Error al vaciar el carrito.");
      }
      cartMutateRef.current();
      return res;
    } finally {
      setIsMutating(false);
    }
  }, []);

  return { trigger, isMutating };
}

export function useCheckoutCart() {
  const [isMutating, setIsMutating] = useState(false);
  const cartMutate = useCartMutate();
  const cartMutateRef = useRef(cartMutate);
  useEffect(() => {
    cartMutateRef.current = cartMutate;
  }, [cartMutate]);

  const trigger = useCallback(async (payload: CheckoutCartPayload) => {
    setIsMutating(true);
    try {
      const res = await checkoutCartHandler(payload);
      if (res.status === 201) {
        cartMutateRef.current({
          status: 404,
          data: undefined,
        } as getCartHandlerResponse);
      }
      return res;
    } finally {
      setIsMutating(false);
    }
  }, []);

  return { trigger, isMutating };
}
