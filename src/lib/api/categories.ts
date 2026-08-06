import useSWR, { mutate as mutateCache } from "swr";

import type {
  Category,
  CreateCategoryRequest,
  DeleteCategoryResponse,
  ErrorResponse,
  GetCategoryByIdResponse,
  UpdateCategoryRequest,
  UpdateCategoryResponse,
} from "./schemas";

const CATEGORIES_URL = "http://localhost:8080/api/v1/products/categories";

export type CategoryOrder = "asc" | "desc";

export type CategoryFilters = {
  display_name?: string;
  order?: CategoryOrder;
};

export type GetCategoriesResponse = {
  categories: Category[];
};

export class CategoryApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "CategoryApiError";
  }
}

function categoryUrl(id: string): string {
  return `${CATEGORIES_URL}/${encodeURIComponent(id)}`;
}

export function getCategoriesUrl(filters: CategoryFilters = {}): string {
  const params = new URLSearchParams();
  const search = filters.display_name?.trim();

  if (search) params.set("display_name", search);
  if (filters.order) params.set("order", filters.order);

  const query = params.toString();
  return query ? `${CATEGORIES_URL}?${query}` : CATEGORIES_URL;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;

  let message = "Ocurrió un error al procesar la solicitud.";
  try {
    const error = (await response.json()) as ErrorResponse;
    if (error.message) message = error.message;
  } catch {
    // The backend may return an empty or non-JSON error response.
  }

  throw new CategoryApiError(response.status, message);
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  return parseResponse<T>(response);
}

export function listCategories(
  filters: CategoryFilters = {},
  signal?: AbortSignal
): Promise<GetCategoriesResponse> {
  return request<GetCategoriesResponse>(getCategoriesUrl(filters), { signal });
}

export function getCategory(id: string): Promise<GetCategoryByIdResponse> {
  return request<GetCategoryByIdResponse>(categoryUrl(id));
}

export function createCategory(
  input: CreateCategoryRequest
): Promise<Category> {
  return request<Category>(CATEGORIES_URL, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCategory(
  id: string,
  input: UpdateCategoryRequest
): Promise<UpdateCategoryResponse> {
  return request<UpdateCategoryResponse>(categoryUrl(id), {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteCategory(id: string): Promise<DeleteCategoryResponse> {
  return request<DeleteCategoryResponse>(categoryUrl(id), {
    method: "DELETE",
  });
}

export function useCategories(filters: CategoryFilters = {}) {
  const key = getCategoriesUrl(filters);
  return useSWR(key, () => listCategories(filters), {
    keepPreviousData: true,
  });
}

export function useCategory(id?: string) {
  const key = id ? categoryUrl(id) : null;
  return useSWR(key, () => getCategory(id as string));
}

export async function invalidateCategories(): Promise<void> {
  await mutateCache(
    (key) => typeof key === "string" && key.startsWith(CATEGORIES_URL)
  );
}
