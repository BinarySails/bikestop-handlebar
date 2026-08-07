import { useEffect, useState } from "react";
import {
  ArchiveIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react";

import { CreateUserDialog } from "@/components/features/users/create-user-modal";
import { UserActionsMenu } from "@/components/features/users/user-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
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
    if (params.view !== UserViewParam.client) return;
    const timeout = window.setTimeout(() => {
      const search = searchInput.trim() || undefined;
      if (search !== params.search) onParamsChange({ search, offset: 0 });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [onParamsChange, params.search, params.view, searchInput]);

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
  const roles =
    rolesQuery.data?.status === 200
      ? rolesQuery.data.data.roles.filter(
          (role) => role.slug !== "client" && role.status === "active"
        )
      : [];
  const invalidResponse = query.data && query.data.status !== 200;
  const hasError = Boolean(query.error || invalidResponse);
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

  const columnCount = showRoles ? 4 : 3;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Administra los usuarios, clientes y sus accesos en BikeStop.
          </p>
        </div>
        <div className="shrink-0">
          <CreateUserDialog onCreated={() => query.mutate()} />
        </div>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <UsersIcon className="size-4" /> Directorio de usuarios
          </CardTitle>

          <div className="flex flex-wrap items-center justify-between gap-3">
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

            {params.view !== UserViewParam.client && (
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
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {params.view === UserViewParam.client ? (
              <InputGroup className="w-full max-w-xl">
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Buscar por nombre, usuario o correo"
                  aria-label="Buscar por nombre, usuario o correo"
                />
              </InputGroup>
            ) : params.view === UserViewParam.staff ? (
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
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-56 pl-5">Usuario</TableHead>
                <TableHead className="w-64">Correo</TableHead>
                {showRoles && <TableHead>Roles</TableHead>}
                <TableHead className="w-16 text-center">
                  <span className="sr-only">Ver detalles</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading && !response
                ? Array.from({ length: 5 }, (_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: columnCount }, (__, cell) => (
                        <TableCell key={cell} className="py-3">
                          <Skeleton className="h-5 w-full max-w-36" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : null}

              {hasError && (
                <TableRow>
                  <TableCell colSpan={columnCount} className="h-36 text-center">
                    <p className="mb-3 text-sm text-destructive">
                      No fue posible cargar los usuarios.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => query.mutate()}
                    >
                      Reintentar
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {!query.isLoading && !hasError && users.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columnCount}
                    className="h-36 text-center text-muted-foreground"
                  >
                    {params.search || params.role
                      ? "No hay usuarios que coincidan con los filtros."
                      : params.view === UserViewParam.client
                        ? "No se encontraron clientes."
                        : "No hay usuarios en esta vista."}
                  </TableCell>
                </TableRow>
              )}

              {!hasError &&
                users.map((user) => {
                  const displayName = [
                    user.name,
                    user.father_last_name,
                    user.mother_last_name,
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <TableRow
                      key={user.id}
                      className="border-gray-100 hover:bg-gray-50/80"
                    >
                      <TableCell className="py-3 pl-5">
                        <div className="flex items-center gap-2">
                          <span className="block font-semibold">
                            {displayName}
                          </span>
                          {params.view === UserViewParam.archived && (
                            <Badge variant="destructive">
                              <ArchiveIcon className="size-3" />
                              Archivado
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          @{user.username}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-gray-600">
                        {user.email}
                      </TableCell>
                      {showRoles && (
                        <TableCell className="py-3">
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
                      <TableCell className="py-3 text-center">
                        <UserActionsMenu
                          user={user}
                          archived={params.view === UserViewParam.archived}
                          onUpdated={() => query.mutate()}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
          {query.isValidating && response && (
            <div
              className="h-0.5 animate-pulse bg-primary/40"
              aria-label="Actualizando usuarios"
            />
          )}
        </CardContent>

        <CardFooter className="justify-end gap-3 border-t">
          <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
            <span>Filas por página</span>
            <Select
              value={String(limit)}
              onValueChange={(value) =>
                onParamsChange({ limit: Number(value), offset: 0 })
              }
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {[10, 20, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="mx-1">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={offset === 0}
                aria-label="Primera página"
                onClick={() => onParamsChange({ offset: 0 })}
              >
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={offset === 0}
                aria-label="Página anterior"
                onClick={() =>
                  onParamsChange({ offset: Math.max(0, offset - limit) })
                }
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={currentPage >= totalPages}
                aria-label="Página siguiente"
                onClick={() => onParamsChange({ offset: offset + limit })}
              >
                <ChevronRightIcon />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={currentPage >= totalPages}
                aria-label="Última página"
                onClick={() =>
                  onParamsChange({ offset: (totalPages - 1) * limit })
                }
              >
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
