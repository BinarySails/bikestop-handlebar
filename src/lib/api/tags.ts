import useSwr, { mutate } from "swr";

import type { SaleOrderTag } from "./schemas";

const API_BASE = "http://localhost:8080/api/v1";

export class TagApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "TagApiError";
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new TagApiError(
      response.status,
      error?.message || `Request failed with status ${response.status}`,
    );
  }

  return response.json();
}

type ListTagsParams = {
  status?: string;
};

export function useListTags(params?: ListTagsParams) {
  const url = new URL(`${API_BASE}/sale-order-tags`);
  if (params?.status) url.searchParams.set("status", params.status);

  return useSwr<{ tag: SaleOrderTag[] }>(
    `tags-${params?.status || "all"}`,
    () => fetchJson(url.toString()),
    { revalidateOnFocus: false },
  );
}

export function useGetTag(id: string | undefined) {
  return useSwr<{ tag: SaleOrderTag }>(
    id ? `tag-${id}` : null,
    () => fetchJson(`${API_BASE}/sale-order-tags/${id}`),
    { revalidateOnFocus: false },
  );
}

export async function createTag(data: {
  display_name: string;
  slug: string;
  color?: string;
}): Promise<{ tag: SaleOrderTag }> {
  return fetchJson(`${API_BASE}/sale-order-tags`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTag(
  id: string,
  data: {
    display_name: string;
    slug: string;
    color?: string;
    status: string;
  },
): Promise<{ tag: SaleOrderTag }> {
  return fetchJson(`${API_BASE}/sale-order-tags/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteTag(id: string): Promise<void> {
  await fetchJson(`${API_BASE}/sale-order-tags/${id}`, {
    method: "DELETE",
  });
}

export function invalidateTags() {
  return mutate((key) => {
    if (typeof key === "string" && key.startsWith("tags")) return true;
    return false;
  });
}
