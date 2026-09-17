import { useListRolesHandler, useListUsersRequest } from "@/lib/api/api";
import {
  SortOrderParam,
  UserSortByParam,
  UserViewParam,
} from "@/lib/api/schemas";

export type VendorOption = {
  id: string;
  name: string;
};

function fullName(user: {
  name: string;
  father_last_name: string;
  mother_last_name?: string | null;
}): string {
  return [user.name, user.father_last_name, user.mother_last_name]
    .filter(Boolean)
    .join(" ");
}

export function useVendorOptions() {
  const rolesQuery = useListRolesHandler();
  const vendorRoleId =
    rolesQuery.data?.status === 200
      ? rolesQuery.data.data.roles.find((r) => r.slug === "vendedor")?.id
      : undefined;

  const usersQuery = useListUsersRequest(
    {
      view: UserViewParam.staff,
      role: vendorRoleId,
      limit: 100,
      sort_by: UserSortByParam.display_name,
      sort_order: SortOrderParam.asc,
    },
    { swr: { enabled: Boolean(vendorRoleId) } }
  );

  const users =
    usersQuery.data?.status === 200 ? usersQuery.data.data.users : [];
  const options: VendorOption[] = users
    .filter((user) => user.status === "enable")
    .map((user) => ({ id: user.id, name: fullName(user) }));

  return {
    roleLoading: rolesQuery.isLoading,
    roleMissing: Boolean(
      rolesQuery.data?.status === 200 && vendorRoleId === undefined
    ),
    options,
    isLoading: usersQuery.isLoading,
    hasError: Boolean(usersQuery.error),
  };
}
