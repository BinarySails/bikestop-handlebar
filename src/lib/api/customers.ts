import useSwr, { mutate } from "swr";

import type { Customer, Branch } from "./schemas";

const API_BASE = "http://localhost:8080/api/v1";

export class CustomerApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "CustomerApiError";
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
    throw new CustomerApiError(
      response.status,
      error?.message || `Request failed with status ${response.status}`,
    );
  }

  return response.json();
}

// Customer API

type ListCustomersParams = {
  status?: string;
};

export function useListCustomers(params?: ListCustomersParams) {
  const url = new URL(`${API_BASE}/customers`);
  if (params?.status) url.searchParams.set("status", params.status);

  return useSwr<{ customer: Customer[] }>(
    `customers-${params?.status || "all"}`,
    () => fetchJson(url.toString()),
    { revalidateOnFocus: false },
  );
}

export function useGetCustomer(id: string | undefined) {
  return useSwr<{ customer: Customer }>(
    id ? `customer-${id}` : null,
    () => fetchJson(`${API_BASE}/customers/${id}`),
    { revalidateOnFocus: false },
  );
}

export async function createCustomer(data: {
  user_id: string;
  company_name: string;
  tax_id?: string;
  phone?: string;
  email?: string;
}): Promise<{ customer: Customer }> {
  return fetchJson(`${API_BASE}/customers`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCustomer(
  id: string,
  data: {
    company_name: string;
    tax_id?: string;
    phone?: string;
    email?: string;
    status: string;
  },
): Promise<{ customer: Customer }> {
  return fetchJson(`${API_BASE}/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  await fetchJson(`${API_BASE}/customers/${id}`, {
    method: "DELETE",
  });
}

export function invalidateCustomers() {
  return mutate((key) => {
    if (typeof key === "string" && key.startsWith("customers")) return true;
    return false;
  });
}

// Branch API

export function useListBranches(customerId: string | undefined) {
  return useSwr<{ branch: Branch[] }>(
    customerId ? `branches-${customerId}` : null,
    () => fetchJson(`${API_BASE}/customers/${customerId}/branches`),
    { revalidateOnFocus: false },
  );
}

export async function createBranch(
  customerId: string,
  data: {
    state_id: string;
    locality_id: string;
    postal_code: string;
    address: string;
    is_default: boolean;
  },
): Promise<{ branch: Branch }> {
  return fetchJson(`${API_BASE}/customers/${customerId}/branches`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteBranch(
  customerId: string,
  branchId: string,
): Promise<void> {
  await fetchJson(
    `${API_BASE}/customers/${customerId}/branches/${branchId}`,
    {
      method: "DELETE",
    },
  );
}

export function invalidateBranches(customerId: string) {
  return mutate((key) => {
    if (typeof key === "string" && key === `branches-${customerId}`)
      return true;
    return false;
  });
}
