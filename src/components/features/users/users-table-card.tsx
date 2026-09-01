/* oxlint-disable react/no-unstable-nested-components -- column cells are render callbacks, not components */
import { ArchiveIcon, UsersIcon } from "lucide-react";

import { CreateUserDialog } from "@/components/features/users/create-user-modal";
import { UserActionsMenu } from "@/components/features/users/user-actions-menu";
import { SiteHeader } from "@/components/features/layout/site-header";
import { EntityCardTitle } from "@/components/features/entity/entity-card-title";
import {
  EntityIndexPage,
  type EntityColumn,
} from "@/components/features/entity/entity-index-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListRolesHandler, useListUsersRequest } from "@/lib/api/api";
import {
  SortOrderParam,
  UserSortByParam,
  UserViewParam,
  type ListUsersRequestParams,
  type UserWithRolesResponse,
} from "@/lib/api/schemas";
import { cn } from "@/lib/utils";

type UsersTableCardProps = {
  params: ListUsersRequestParams;
  onParamsChange: (updates: Partial<ListUsersRequestParams>) => void;
};

function userDisplayName(user: UserWithRolesResponse): string {
  return [user.name, user.father_last_name, user.mother_last_name]
    .filter(Boolean)
    .join(" ");
}

export function UsersTableCard({
  params,
  onParamsChange,
}: UsersTableCardProps) {
  const queryParams: ListUsersRequestParams = {
    view: params.view,
    role: params.view === UserViewParam.staff ? params.role : undefined,
    limit: params.limit,
    offset: params.offset,
    sort_by: params.sort_by ?? UserSortByParam.display_name,
    sort_order: params.sort_order ?? SortOrderParam.asc,
  };
  const query = useListUsersRequest(queryParams, {
    swr: { keepPreviousData: true },
  });
  const rolesQuery = useListRolesHandler();

  const response = query.data?.status === 200 ? query.data.data : undefined;
  const users = (response?.users ?? []).filter(
    (user) =>
      params.view !== UserViewParam.archived ||
      (user.status === "disable" &&
        user.roles.some((role) => role.slug !== "client"))
  );
  const total = response?.total ?? 0;
  const limit = response?.limit ?? params.limit ?? 20;
  const offset = response?.offset ?? params.offset ?? 0;
  const roles =
    rolesQuery.data?.status === 200
      ? rolesQuery.data.data.roles.filter(
          (role) => role.slug !== "client" && role.status === "enable"
        )
      : [];
  const invalidResponse = query.data && query.data.status !== 200;
  const hasError = Boolean(query.error || invalidResponse);
  function changeView(view: ListUsersRequestParams["view"]) {
    onParamsChange({
      view,
      role: undefined,
      sort_by: UserSortByParam.display_name,
      sort_order: SortOrderParam.asc,
      offset: 0,
    });
  }

  const columns: EntityColumn<UserWithRolesResponse>[] = [
    {
      header: "Usuario",
      className: "w-56 pl-5",
      cell: (user) => (
        <div className="flex items-center gap-2">
          <span className="block font-semibold">{userDisplayName(user)}</span>
          {params.view === UserViewParam.archived && (
            <Badge variant="destructive">
              <ArchiveIcon className="size-3" />
              Archivado
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: "Correo",
      className: "w-64",
      cell: (user) => <span className="text-gray-600">{user.email}</span>,
    },
    {
      header: "Roles",
      cell: (user: UserWithRolesResponse) => (
        <div className="flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <Badge
              key={role.id}
              variant="secondary"
              className="rounded-full font-normal"
            >
              {role.display_name}
            </Badge>
          ))}
          {user.roles.length === 0 && (
            <span className="text-xs text-muted-foreground">Sin roles</span>
          )}
        </div>
      ),
    },
    {
      header: <span className="sr-only">Ver detalles</span>,
      className: "w-16 text-center",
      cell: (user) => (
        <UserActionsMenu
          user={user}
          archived={params.view === UserViewParam.archived}
          onUpdated={() => query.mutate()}
        />
      ),
    },
  ];

  const emptyMessage =
    params.search || params.role
      ? "No hay usuarios que coincidan con los filtros."
      : params.view === UserViewParam.archived
        ? "No hay usuarios archivados."
        : "No hay usuarios en esta vista.";

  return (
    <>
      <SiteHeader
        title="Usuarios"
        description="Administra los usuarios, clientes y sus accesos en BikeStop."
        actions={<CreateUserDialog onCreated={() => query.mutate()} />}
      />
      <EntityIndexPage<UserWithRolesResponse>
        ariaLabel="Usuarios"
        cardTitle={
          <EntityCardTitle icon={UsersIcon}>
            Directorio de usuarios
          </EntityCardTitle>
        }
        cardHeaderExtras={
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                className="flex w-fit items-center gap-1 rounded-lg bg-gray-100 p-1"
                aria-label="Vistas de usuarios"
              >
                {([[UserViewParam.staff, "Usuarios"]] as const).map(
                  ([view, label]) => (
                    <Button
                      key={view}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => changeView(view)}
                      className={cn(
                        "text-gray-500 hover:bg-white/70",
                        params.view === view &&
                          "border border-gray-200 bg-white text-gray-900 shadow-xs hover:bg-white"
                      )}
                    >
                      {label}
                    </Button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  changeView(
                    params.view === UserViewParam.archived
                      ? UserViewParam.staff
                      : UserViewParam.archived
                  )
                }
              >
                <ArchiveIcon data-icon="inline-start" />
                {params.view === UserViewParam.archived
                  ? "Mostrar activos"
                  : "Mostrar archivados"}
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {params.view === UserViewParam.staff ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Filtrar por rol</span>
                  <Select
                    value={params.role ?? "all"}
                    onValueChange={(value) =>
                      onParamsChange({
                        role: value && value !== "all" ? value : undefined,
                        offset: 0,
                      })
                    }
                  >
                    <SelectTrigger size="sm" className="min-w-40">
                      <SelectValue>
                        {params.role
                          ? (roles.find((role) => role.id === params.role)
                              ?.display_name ?? "Rol seleccionado")
                          : "Todos los roles"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los roles</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Usuarios inactivos
                </span>
              )}
            </div>
          </>
        }
        columns={columns}
        rows={users}
        rowKey={(user) => user.id}
        loading={query.isLoading && !response}
        validating={query.isValidating && !!response}
        hasError={hasError}
        errorMessage="No fue posible cargar los usuarios."
        onRetry={() => query.mutate()}
        emptyMessage={emptyMessage}
        pagination={{
          mode: "offset",
          total,
          limit,
          offset,
          onLimitChange: (nextLimit) =>
            onParamsChange({ limit: nextLimit, offset: 0 }),
          onOffsetChange: (nextOffset) =>
            onParamsChange({ offset: nextOffset }),
        }}
      />
    </>
  );
}
