import useSwr from "swr";

import { getGetCartHandlerUrl } from "@/lib/api/api";
import type { GetCartResponse } from "@/lib/api/schemas";

function customerCartUrl(customerId: string) {
  const origin = new URL(getGetCartHandlerUrl()).origin;
  return `${origin}/api/v1/customers/${customerId}/cart`;
}

export type UseCustomerCartResult = {
  cart: GetCartResponse | null;
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
};

export function useCustomerCart(
  customerId: string | undefined
): UseCustomerCartResult {
  const swrKey = customerId ? (["customer-cart", customerId] as const) : null;

  const { data, error, isLoading, mutate } = useSwr<GetCartResponse | null>(
    swrKey,
    async () => {
      if (!customerId) return null;

      const response = await fetch(customerCartUrl(customerId), {
        credentials: "include",
      });

      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Error al cargar el carro.");

      return (await response.json()) as GetCartResponse;
    },
    { revalidateOnFocus: false }
  );

  return {
    cart: data ?? null,
    isLoading,
    error: error ? "Error al cargar el carro." : null,
    mutate,
  };
}
