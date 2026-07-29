import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import type { SWRConfiguration } from "swr";
import type { SWRMutationConfiguration } from "swr/mutation";
import type { Key } from "swr";

const BASE_URL = "http://localhost:8080";

export interface Role {
  id: string;
  display_name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateRoleRequest {
  display_name: string;
  slug: string;
}

export interface UpdateRolePayload {
  display_name: string;
  slug: string;
  is_active: boolean;
}

export interface CreateRoleResponse {
  role: Role;
}

export interface UpdateRoleResponse {
  role: Role;
}

export interface DeleteRoleResponse {
  success: boolean;
}

export interface ListRolesResponse {
  roles: Role[];
}

const getListRolesUrl = () => `${BASE_URL}/api/v1/rbac/roles`;
const getRoleUrl = (role_id: string) => `${BASE_URL}/api/v1/rbac/roles/${role_id}`;

const safeJson = async <T>(res: Response): Promise<T> => {
  const body = [204, 205, 304].includes(res.status) ? null : await res.text();
  return body ? JSON.parse(body) : ({} as T);
};

export const listRoles = async (options?: RequestInit): Promise<ListRolesResponse> => {
  const res = await fetch(getListRolesUrl(), { credentials: "include", ...options });
  return safeJson<ListRolesResponse>(res);
};

export const createRole = async (
  data: CreateRoleRequest,
  options?: RequestInit,
): Promise<CreateRoleResponse> => {
  const res = await fetch(getListRolesUrl(), {
    credentials: "include",
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(data),
  });
  return safeJson<CreateRoleResponse>(res);
};

export const updateRole = async (
  role_id: string,
  data: UpdateRolePayload,
  options?: RequestInit,
): Promise<UpdateRoleResponse> => {
  const res = await fetch(getRoleUrl(role_id), {
    credentials: "include",
    ...options,
    method: "PUT",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(data),
  });
  return safeJson<UpdateRoleResponse>(res);
};

export const deleteRole = async (
  role_id: string,
  options?: RequestInit,
): Promise<DeleteRoleResponse> => {
  const res = await fetch(getRoleUrl(role_id), {
    credentials: "include",
    ...options,
    method: "DELETE",
  });
  return safeJson<DeleteRoleResponse>(res);
};

export const getListRolesKey = () => [getListRolesUrl()] as const;

export const useRolesList = (
  options?: SWRConfiguration<ListRolesResponse>,
) => useSWR(getListRolesKey(), () => listRoles(), options);

export const useCreateRole = <TError = unknown>(
  options?: {
    swr?: SWRMutationConfiguration<CreateRoleResponse, TError, Key, CreateRoleRequest>;
    fetch?: RequestInit;
  },
) => {
  const { swr: swrOptions, fetch: fetchOptions } = options ?? {};
  const swrFn = (_: Key, { arg }: { arg: CreateRoleRequest }) => createRole(arg, fetchOptions);
  return useSWRMutation(getListRolesKey(), swrFn, swrOptions);
};

export const useUpdateRole = <TError = unknown>(
  options?: {
    swr?: SWRMutationConfiguration<UpdateRoleResponse, TError, Key, { role_id: string; data: UpdateRolePayload }>;
    fetch?: RequestInit;
  },
) => {
  const { swr: swrOptions, fetch: fetchOptions } = options ?? {};
  const swrFn = (_: Key, { arg }: { arg: { role_id: string; data: UpdateRolePayload } }) =>
    updateRole(arg.role_id, arg.data, fetchOptions);
  return useSWRMutation(getListRolesKey(), swrFn, swrOptions);
};

export const useDeleteRole = <TError = unknown>(
  options?: {
    swr?: SWRMutationConfiguration<DeleteRoleResponse, TError, Key, { role_id: string }>;
    fetch?: RequestInit;
  },
) => {
  const { swr: swrOptions, fetch: fetchOptions } = options ?? {};
  const swrFn = (_: Key, { arg }: { arg: { role_id: string } }) =>
    deleteRole(arg.role_id, fetchOptions);
  return useSWRMutation(getListRolesKey(), swrFn, swrOptions);
};
