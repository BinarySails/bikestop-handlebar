import useSwr from "swr";
import useSWRMutation from "swr/mutation";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CartItemPrice = {
  id: string;
  variant_id: string;
  price_type: string;
  amount: number;
  currency: string;
};

export type CartItemImage = {
  id: string;
  variant_id: string;
  image_url: string;
  image_index: number;
};

export type CartItemProperty = {
  property_name: string;
  property_value: string;
};

export type CartItem = {
  id: string;
  variant_id: string;
  sku: string;
  display_name: string;
  properties: CartItemProperty[];
  prices: CartItemPrice[];
  images: CartItemImage[];
  quantity: number;
  unit_price: number;
  currency: string;
  line_total: number;
};

export type Cart = {
  id: string;
  items: CartItem[];
  item_count: number;
  subtotal: number;
  currency: string;
};

export type CartResponse =
  | { data: Cart; status: 200; headers: Headers }
  | { data: void; status: 404; headers: Headers };

// ---------------------------------------------------------------------------
// SWR key
// ---------------------------------------------------------------------------

export const CART_KEY = "/api/v1/cart";

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchCart(): Promise<CartResponse> {
  const res = await fetch(`${API_BASE}${CART_KEY}`, {
    credentials: "include",
  });
  const body = [204, 205, 304].includes(res.status)
    ? null
    : await res.text();
  const data = body ? JSON.parse(body) : undefined;
  return { data, status: res.status, headers: res.headers } as CartResponse;
}

async function fetchUpdateCartItem(
  _: string,
  { arg }: { arg: { itemId: string; quantity: number } }
) {
  const res = await fetch(
    `${API_BASE}/api/v1/cart/items/${arg.itemId}`,
    {
      credentials: "include",
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: arg.quantity }),
    }
  );
  const body = [204, 205, 304].includes(res.status)
    ? null
    : await res.text();
  const data = body ? JSON.parse(body) : undefined;
  return { data, status: res.status, headers: res.headers };
}

async function fetchDeleteCartItem(
  _: string,
  { arg }: { arg: { itemId: string } }
) {
  const res = await fetch(
    `${API_BASE}/api/v1/cart/items/${arg.itemId}`,
    {
      credentials: "include",
      method: "DELETE",
    }
  );
  return { status: res.status };
}

async function fetchClearCart() {
  const res = await fetch(`${API_BASE}/api/v1/cart`, {
    credentials: "include",
    method: "DELETE",
  });
  return { status: res.status };
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useGetCart() {
  return useSwr<CartResponse>(CART_KEY, fetchCart, {
    revalidateOnFocus: true,
    revalidateIfStale: true,
  });
}

export function useUpdateCartItem() {
  return useSWRMutation(CART_KEY, fetchUpdateCartItem);
}

export function useDeleteCartItem() {
  return useSWRMutation(CART_KEY, fetchDeleteCartItem);
}

export function useClearCart() {
  return useSWRMutation(CART_KEY, fetchClearCart);
}
