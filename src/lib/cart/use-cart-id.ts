const CART_ID_KEY = "bikestop-cart-id";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function isValidCartId(id: string | null): id is string {
  return typeof id === "string" && UUID_REGEX.test(id);
}

function generateUuid(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    ""
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function getCartId(): string | null {
  if (!isBrowser()) return null;
  try {
    const value = window.localStorage.getItem(CART_ID_KEY);
    return isValidCartId(value) ? value : null;
  } catch {
    return null;
  }
}

export function createCartId(): string {
  const id = generateUuid();
  if (isBrowser()) {
    try {
      window.localStorage.setItem(CART_ID_KEY, id);
    } catch {
      // ignore storage errors
    }
  }
  return id;
}

export function getOrCreateCartId(): string | null {
  if (!isBrowser()) return null;
  return getCartId() ?? createCartId();
}
