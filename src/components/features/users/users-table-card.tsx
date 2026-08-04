import { useMemo, useState } from "react";
import {
  CheckCircle2Icon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Clock3Icon,
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

type UserStatus = "Activo" | "Desactivado";
type Filter = "all" | "active" | "disabled";

type UserRow = {
  id: number;
  user: string;
  role: string;
  status: UserStatus;
};

const users: UserRow[] = [
  {
    id: 1,
    user: "Juan Pérez",
    role: "Administrador",
    status: "Activo",
  },
];

export function UsersTableCard() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const filteredUsers = useMemo(() => {
    if (filter === "active")
      return users.filter((user) => user.status === "Activo");
    if (filter === "disabled")
      return users.filter((user) => user.status === "Desactivado");
    return users;
  }, [filter]);

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

        <div
          className="col-span-full flex w-fit items-center gap-1 rounded-lg bg-gray-100 p-1"
          aria-label="Filtros de usuarios"
        >
          {(
            [
              ["all", "Todos"],
              ["active", "Activos"],
              ["disabled", "Desactivados"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFilter(value)}
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
                  {value === "active" ? 1 : 0}
                </Badge>
              )}
            </Button>
          ))}
        </div>
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
              <TableHead className="w-64">Usuario</TableHead>
              <TableHead className="w-48">Rol</TableHead>
              <TableHead className="w-36">Estado</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Ver detalles</span>
              </TableHead>
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
                <TableCell className="py-3">
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-gray-100 font-normal text-gray-600"
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="py-3">
                  <Badge
                    variant="ghost"
                    className={cn(
                      "gap-1 px-0",
                      user.status === "Activo"
                        ? "text-emerald-600"
                        : "text-gray-500"
                    )}
                  >
                    {user.status === "Activo" ? (
                      <CheckCircle2Icon />
                    ) : (
                      <Clock3Icon />
                    )}
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="py-3">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Ver detalles de ${user.user}`}
                  >
                    <EyeIcon />
                  </Button>
                </TableCell>
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
