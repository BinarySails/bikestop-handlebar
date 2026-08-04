import { useEffect, useState } from "react";
import {
  ArchiveIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
} from "lucide-react";

import { CreateUserDialog } from "@/components/features/users/create-user-modal";
import { EditUserDialog } from "@/components/features/users/edit-user-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
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
  const users = response?.users ?? [];
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

  const columnCount = 5;

  return (
    <Card className="mx-auto max-w-5xl gap-0 border border-gray-200 py-0 shadow-none ring-0">
      <CardHeader className="gap-4 border-b border-gray-100 px-5 py-5">
        <CardTitle className="text-lg font-semibold">Usuarios</CardTitle>
        <CardAction>
          <CreateUserDialog onCreated={() => query.mutate()} />
        </CardAction>

        <div className="col-span-full flex flex-wrap items-center justify-between gap-3">
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

          <Button
            variant={
              params.view === UserViewParam.archived ? "default" : "outline"
            }
            size="sm"
            onClick={() => changeView(UserViewParam.archived)}
          >
            <ArchiveIcon data-icon="inline-start" />
            Usuarios archivados
          </Button>
        </div>

        <div className="col-span-full flex flex-wrap items-center justify-between gap-3">
          {params.view === UserViewParam.client ? (
            <InputGroup className="max-w-sm">
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
                  <SelectValue />
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

      <CardContent className="px-0">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow className="hover:bg-gray-50">
              <TableHead className="w-56 pl-5">Usuario</TableHead>
              {params.view === UserViewParam.client && (
                <TableHead className="w-40">Fecha de registro</TableHead>
              )}
              <TableHead className="w-64">Correo</TableHead>
              {showRoles && <TableHead>Roles</TableHead>}
              <TableHead className="w-24">Estado</TableHead>
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
                      <span className="block font-semibold">{displayName}</span>
                      <span className="text-xs text-muted-foreground">
                        @{user.username}
                      </span>
                    </TableCell>
                    {params.view === UserViewParam.client && (
                      <TableCell className="py-3 text-gray-600">
                        {new Intl.DateTimeFormat("es-MX", {
                          dateStyle: "medium",
                        }).format(new Date(user.created_at))}
                      </TableCell>
                    )}
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
                    <TableCell className="py-3">
                      <Badge
                        variant={
                          user.status === "active" ? "secondary" : "outline"
                        }
                      >
                        {user.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <EditUserDialog
                        user={user}
                        roles={roles}
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

      <CardFooter className="justify-end gap-3 bg-white px-5 py-4">
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
  );
}
