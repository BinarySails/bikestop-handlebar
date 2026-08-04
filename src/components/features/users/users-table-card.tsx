import { useMemo, useState } from "react";
import {
  ArchiveIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  GripVerticalIcon,
} from "lucide-react";

import { CreateUserDialog } from "@/components/features/users/create-user-modal";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type UserType = "client" | "team";
type Filter = "all" | UserType;

type UserRow = {
  id: number;
  user: string;
  email: string;
  type: UserType;
  role: string;
};

const users: UserRow[] = [
  {
    id: 1,
    user: "Juan Pérez",
    email: "juan.perez@bikestop.mx",
    type: "team",
    role: "Administrador",
  },
];

export function UsersTableCard() {
  const [filter, setFilter] = useState<Filter>("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (filter !== "all" && user.type !== filter) return false;
      if (filter === "team" && roleFilter !== "all") {
        return user.role === roleFilter;
      }
      return true;
    });
  }, [filter, roleFilter]);

  const roles = useMemo(
    () => [
      ...new Set(
        users.filter((user) => user.type === "team").map((user) => user.role)
      ),
    ],
    []
  );

  const allVisibleSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((user) => selected.has(user.id));
  const someVisibleSelected =
    !allVisibleSelected && filteredUsers.some((user) => selected.has(user.id));

  function toggleAll(checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      filteredUsers.forEach((user) =>
        checked ? next.add(user.id) : next.delete(user.id)
      );
      return next;
    });
  }

  function toggleRow(id: number, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <Card className="mx-auto max-w-4xl gap-0 border border-gray-200 py-0 shadow-none ring-0">
      <CardHeader className="gap-4 border-b border-gray-100 px-5 py-5">
        <CardTitle className="text-lg font-semibold">Usuarios</CardTitle>
        <CardAction>
          <CreateUserDialog />
        </CardAction>

        <div className="col-span-full flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex w-fit items-center gap-1 rounded-lg bg-gray-100 p-1"
            aria-label="Filtros de usuarios"
          >
            {(
              [
                ["all", "Todos"],
                ["client", "Clientes"],
                ["team", "Equipo"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilter(value);
                  setRoleFilter("all");
                }}
                className={cn(
                  "text-gray-500 hover:bg-white/70",
                  filter === value &&
                    "border border-gray-200 bg-white text-gray-900 shadow-xs hover:bg-white"
                )}
              >
                {label}
                {value !== "all" && (
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 rounded-full px-1.5 text-[11px]"
                  >
                    {users.filter((user) => user.type === value).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          <Button variant="outline" size="sm">
            <ArchiveIcon data-icon="inline-start" />
            Usuarios archivados
          </Button>
        </div>

        {filter === "team" && (
          <div className="col-span-full flex items-center gap-2">
            <span className="text-sm text-gray-500">Filtrar por rol</span>
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value ?? "all")}
            >
              <SelectTrigger size="sm" className="min-w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>

      <CardContent className="px-0">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow className="hover:bg-gray-50">
              <TableHead className="w-20 pl-4">
                <div className="flex items-center gap-2">
                  <span className="w-4" aria-hidden="true" />
                  <Checkbox
                    aria-label="Seleccionar todos los usuarios visibles"
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onCheckedChange={toggleAll}
                  />
                </div>
              </TableHead>
              <TableHead className="w-48">Usuario</TableHead>
              <TableHead className="w-60">Correo</TableHead>
              {filter !== "client" && (
                <TableHead className="w-40">Rol</TableHead>
              )}
              <TableHead className="w-16 text-center">
                <span className="sr-only">Ver detalles</span>
              </TableHead>
              <TableHead aria-hidden="true" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow
                key={user.id}
                data-state={selected.has(user.id) ? "selected" : undefined}
                className="border-gray-100 hover:bg-gray-50/80"
              >
                <TableCell className="py-3 pl-4">
                  <div className="flex items-center gap-2">
                    <GripVerticalIcon
                      className="size-4 cursor-grab text-gray-400"
                      aria-hidden="true"
                    />
                    <Checkbox
                      aria-label={`Seleccionar ${user.user}`}
                      checked={selected.has(user.id)}
                      onCheckedChange={(checked) => toggleRow(user.id, checked)}
                    />
                  </div>
                </TableCell>
                <TableCell className="py-3 font-semibold">
                  {user.user}
                </TableCell>
                <TableCell className="py-3 text-gray-600">
                  {user.email}
                </TableCell>
                {filter !== "client" && (
                  <TableCell className="py-3">
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-gray-100 font-normal text-gray-600"
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                )}
                <TableCell className="py-3 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Ver detalles de ${user.user}`}
                  >
                    <EyeIcon className="size-5" />
                  </Button>
                </TableCell>
                <TableCell aria-hidden="true" />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <CardFooter className="flex-col justify-between gap-3 bg-white px-5 py-4 sm:flex-row">
        <p className="text-xs text-gray-500">
          {selected.size} of {users.length} row(s) selected.
        </p>
        <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
          <span>Rows per page</span>
          <Select defaultValue="10">
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
          <span className="mx-1">Page 1 of 1</span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled
              aria-label="Primera página"
            >
              <ChevronsLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled
              aria-label="Página anterior"
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled
              aria-label="Página siguiente"
            >
              <ChevronRightIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled
              aria-label="Última página"
            >
              <ChevronsRightIcon />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
