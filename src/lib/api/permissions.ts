import useSWR from "swr";
import type { SWRConfiguration } from "swr";

export interface Permission {
  id: string;
  code: string;
  description: string;
  created_at: string;
}

export interface GetUserPermissionsResponse {
  user_id: string;
  permissions: Permission[];
}

const BASE_URL = "http://localhost:8080";

export const getGetUserPermissionsUrl = (user_id: string) => {
  return `${BASE_URL}/api/v1/auth/${user_id}/permissions`;
};

export const getUserPermissions = async (
  user_id: string,
  options?: RequestInit,
): Promise<GetUserPermissionsResponse> => {
  const res = await fetch(getGetUserPermissionsUrl(user_id), {
    credentials: "include",
    ...options,
  });

  const body = [204, 205, 304].includes(res.status) ? null : await res.text();
  const data: GetUserPermissionsResponse = body ? JSON.parse(body) : {};
  return data;
};

export const getGetUserPermissionsKey = (user_id: string | null) => {
  return user_id ? [`${BASE_URL}/api/v1/auth/${user_id}/permissions`, user_id] : null;
};

export const useGetUserPermissions = (
  user_id: string | null,
  options?: SWRConfiguration<GetUserPermissionsResponse>,
) => {
  return useSWR(
    getGetUserPermissionsKey(user_id),
    () => getUserPermissions(user_id!),
    options,
  );
};
