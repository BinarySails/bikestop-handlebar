import useSWR, { mutate as mutateCache } from "swr";

import type {
  Brand,
  CreateBrandRequest,
  ErrorResponse,
  PaginatedBrand,
  UpdateBrandRequest,
} from "./schemas";

const BRANDS_URL = "http://localhost:8080/api/v1/products/brands";
const REQUEST_TIMEOUT_MS = 15_000;

export type BrandOrder = "asc" | "desc";
export type BrandFilters = {
  page?: number;
  limit?: number;
  display_name?: string;
  order?: BrandOrder;
};

export class BrandApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "BrandApiError";
  }
}

function brandUrl(id: string): string {
  return `${BRANDS_URL}/${encodeURIComponent(id)}`;
}

export function getBrandsUrl(filters: BrandFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.page !== undefined) params.set("page", String(filters.page));
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  if (filters.display_name?.trim()) params.set("display_name", filters.display_name.trim());
  if (filters.order) params.set("order", filters.order);
  const query = params.toString();
  return query ? `${BRANDS_URL}?${query}` : BRANDS_URL;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  let message = "No se pudo completar la solicitud.";
  try {
    const error = (await response.json()) as ErrorResponse;
    if (error.message) message = error.message;
  } catch {
    // Some server failures have no JSON body.
  }
  throw new BrandApiError(response.status, message);
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal = init?.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal;
  let response: Response;
  try {
    response = await fetch(url, {
      credentials: "include",
      ...init,
      signal,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new BrandApiError(0, "La solicitud tardó demasiado tiempo.");
    }
    throw error;
  }
  return parseResponse<T>(response);
}

export function listBrands(filters: BrandFilters, signal?: AbortSignal): Promise<PaginatedBrand> {
  return request<PaginatedBrand>(getBrandsUrl(filters), { signal });
}

export function getBrand(id: string): Promise<Brand> {
  return request<Brand>(brandUrl(id));
}

export function createBrand(input: CreateBrandRequest): Promise<Brand> {
  return request<Brand>(BRANDS_URL, { method: "POST", body: JSON.stringify(input) });
}

export function updateBrand(id: string, input: UpdateBrandRequest): Promise<Brand> {
  return request<Brand>(brandUrl(id), { method: "PATCH", body: JSON.stringify(input) });
}

export function archiveBrand(id: string): Promise<Brand> {
  return request<Brand>(brandUrl(id), { method: "DELETE" });
}

export function toggleBrand(id: string): Promise<Brand> {
  return request<Brand>(`${brandUrl(id)}/toggle`, { method: "PATCH" });
}

export function useBrands(filters: BrandFilters) {
  const key = getBrandsUrl(filters);
  return useSWR(key, () => listBrands(filters), { keepPreviousData: true });
}

export function useBrand(id?: string) {
  return useSWR(id ? brandUrl(id) : null, () => getBrand(id as string));
}

export async function invalidateBrands(): Promise<void> {
  await mutateCache((key) => typeof key === "string" && key.startsWith(BRANDS_URL));
}

