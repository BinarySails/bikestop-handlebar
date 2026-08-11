import { useEffect, useState } from "react";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Search,
  UsersIcon,
} from "lucide-react";

import { CreateUserDialog } from "@/components/features/users/create-user-modal";
import { UserActionsMenu } from "@/components/features/users/user-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListRolesHandler, useListUsersRequest } from "@/lib/api/api";
import {
  SortOrderParam,
  UserSortByParam,
  UserViewParam,
  type ListUsersRequestParams,
} from "@/lib/api/schemas";
import { cn } from "@/lib/utils";

type UsersTableCardProps = {
  params: ListUsersRequestParams;
  onParamsChange: (updates: Partial<ListUsersRequestParams>) => void;
};

function getDisplayName(user: {
  name: string;
  father_last_name: string;
  mother_last_name?: string | null;
}): string {
  return [user.name, user.father_last_name, user.mother_last_name]
    .filter(Boolean)
    .join(" ");
}

function LoadingState() {
  return (
    <div className="space-y-3" aria-label="Cargando usuarios">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function UsersTableCard({
  params,
  onParamsChange,
}: UsersTableCardProps) {
  const [searchInput, setSearchInput] = useState(params.search ?? "");
  const queryParams: ListUsersRequestParams =
    params.view === UserViewParam.client
      ? {
          view: UserViewParam.client,
          search: params.search?.trim() || undefined,
          limit: params.limit,
          offset: params.offset,
        }
      : {
          view: params.view,
          search: params.search?.trim() || undefined,
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

  useEffect(() => setSearchInput(params.search ?? ""), [params.search]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const search = searchInput.trim() || undefined;
      if (search !== params.search) onParamsChange({ search, offset: 0 });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [onParamsChange, params.search, searchInput]);

  const response = query.data?.status === 200 ? query.data.data : undefined;
  const users = (response?.users ?? []).filter(
    (user) =>
      params.view !== UserViewParam.archived ||
      (user.status === "inactive" &&
        user.roles.some((role) => role.slug !== "client"))
  );
  const total = response?.total ?? 0;
  const limit = response?.limit ?? params.limit ?? 20;
  const offset = response?.offset ?? params.offset ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(totalPages, Math.floor(offset / limit) + 1);
  const showRoles = params.view !== UserViewParam.client;
  const isArchivedView = params.view === UserViewParam.archived;
  const roles =
    rolesQuery.data?.status === 200
      ? rolesQuery.data.data.roles.filter(
          (role) => role.slug !== "client" && role.status === "active"
        )
      : [];
  const invalidResponse = query.data && query.data.status !== 200;
  const hasError = Boolean(query.error || invalidResponse);
  const hasFilters = Boolean(params.search || params.role);
  const itemLabel =
    params.view === UserViewParam.client ? "clientes" : "usuarios";

  const emptyTitle = hasFilters
    ? "No hay usuarios que coincidan con los filtros."
    : params.view === UserViewParam.client
      ? "No se encontraron clientes."
      : isArchivedView
        ? "No hay usuarios archivados."
        : "No hay usuarios en esta vista.";

  const emptyHint = hasFilters
    ? "Prueba con otros filtros."
    : params.view === UserViewParam.client
      ? "Los clientes registrados aparecerán aquí."
      : isArchivedView
        ? "Los usuarios inactivos aparecerán aquí."
        : "Crea el primer usuario para comenzar.";

  function changeView(view: ListUsersRequestParams["view"]) {
    setSearchInput("");
    onParamsChange({
      view,
      search: undefined,
      role: undefined,
      sort_by:
        view === UserViewParam.client
          ? undefined
          : UserSortByParam.display_name,
      sort_order:
        view === UserViewParam.client ? undefined : SortOrderParam.asc,
      offset: 0,
    });
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Administra los usuarios, clientes y sus accesos en BikeStop.
          </p>
        </div>
        <CreateUserDialog onCreated={() => query.mutate()} />
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <UsersIcon className="size-4" /> Directorio de usuarios
            </CardTitle>
            <div
              className="flex w-fit items-center gap-1 rounded-lg bg-gray-100 p-1"
              aria-label="Vistas de usuarios"
            >
              {(
                [
                  [UserViewParam.client, "Clientes"],
                  [UserViewParam.staff, "Usuarios"],
                ] as const
              ).map(([view, label]) => (
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
              ))}
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                className="pl-9"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                aria-label="Buscar por nombre, usuario o correo"
                placeholder="Buscar por nombre, usuario o correo"
              />
            </div>

            {params.view === UserViewParam.staff && (
              <Select
                value={params.role ?? "all"}
                onValueChange={(value) =>
                  onParamsChange({
                    role: value && value !== "all" ? value : undefined,
                    offset: 0,
                  })
                }
              >
                <SelectTrigger className="w-44" aria-label="Filtrar por rol">
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
            )}

            {params.view !== UserViewParam.client && (
              <Button
                type="button"
                variant="outline"
                className="sm:ml-auto"
                aria-pressed={isArchivedView}
                onClick={() =>
                  changeView(
                    isArchivedView
                      ? UserViewParam.staff
                      : UserViewParam.archived
                  )
                }
              >
                <Archive />
                {isArchivedView ? "Mostrar activos" : "Mostrar archivados"}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {query.isLoading && !response ? (
            <LoadingState />
          ) : hasError ? (
            <div role="alert" className="space-y-3 py-10 text-center">
              <p className="font-medium">No se pudieron cargar los usuarios.</p>
              <p className="text-sm text-muted-foreground">
                Ocurrió un error al consultar el directorio de usuarios.
              </p>
              <Button variant="outline" onClick={() => query.mutate()}>
                Reintentar
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-medium">{emptyTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">{emptyHint}</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <Table aria-label="Listado de usuarios">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-5">Usuario</TableHead>
                      <TableHead>Correo</TableHead>
                      {showRoles && <TableHead>Roles</TableHead>}
                      <TableHead className="w-12">
                        <span className="sr-only">Acciones</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const displayName = getDisplayName(user);
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="py-4 pl-5">
                            <div className="flex items-center gap-2">
                              <span className="block font-semibold">
                                {displayName}
                              </span>
                              {isArchivedView && (
                                <Badge variant="destructive">
                                  <Archive className="size-3" />
                                  Archivado
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              @{user.username}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-gray-600">
                            {user.email}
                          </TableCell>
                          {showRoles && (
                            <TableCell className="py-4">
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
                                  <span className="text-xs text-muted-foreground">
                                    Sin roles
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="py-4 text-center">
                            <UserActionsMenu
                              user={user}
                              archived={isArchivedView}
                              onUpdated={() => query.mutate()}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-3 md:hidden">
                {users.map((user) => {
                  const displayName = getDisplayName(user);
                  return (
                    <article
                      key={user.id}
                      className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold tracking-tight">
                            {displayName}
                          </h3>
                          {isArchivedView && (
                            <Badge variant="destructive">
                              <Archive className="size-3" />
                              Archivado
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          @{user.username} · {user.email}
                        </p>
                        {showRoles && (
                          <div className="mt-2 flex flex-wrap gap-1">
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
                              <span className="text-xs text-muted-foreground">
                                Sin roles
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <UserActionsMenu
                        user={user}
                        archived={isArchivedView}
                        onUpdated={() => query.mutate()}
                      />
                    </article>
                  );
                })}
              </div>

              {query.isValidating && response && (
                <p
                  className="mt-3 text-xs text-muted-foreground"
                  aria-live="polite"
                >
                  Actualizando usuarios…
                </p>
              )}
            </>
          )}

          {!query.isLoading && !hasError && total > 0 && (
            <nav
              aria-label="Paginación de usuarios"
              className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages} · {total} {itemLabel}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() =>
                    onParamsChange({ offset: Math.max(0, offset - limit) })
                  }
                >
                  <ChevronLeft /> Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => onParamsChange({ offset: offset + limit })}
                >
                  Siguiente <ChevronRight />
                </Button>
              </div>
            </nav>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
