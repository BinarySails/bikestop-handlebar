import { useState, useMemo } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Pencil,
  Trash2,
  CircleCheck,
  CircleX,
  MoreHorizontal,
  ArrowLeft,
  Plus,
  Search,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import {
  useListPermissionsHandler,
  useDeletePermissionHandler,
} from "@/lib/api/api";
import type { Permission } from "@/lib/api/schemas";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreatePermissionDialog } from "@/components/features/rbac/create-permission-dialog";
import { DeletePermissionDialog } from "@/components/features/rbac/delete-permission-dialog";

export const Route = createFileRoute("/_layout/team/permisos")({
  component: PermissionsPage,
});

const PAGE_SIZE = 10;

type StatusFilter = "all" | "active" | "inactive";

const statusFilterLabel: Record<StatusFilter, string> = {
  all: "Todos",
  active: "Activos",
  inactive: "Inactivos",
};

function PermissionsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<
    Permission | undefined
  >(undefined);
  const [deletePermission, setDeletePermission] = useState<
    Permission | undefined
  >(undefined);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, mutate } = useListPermissionsHandler();
  const { trigger: deleteTrigger, isMutating: isDeleting } =
    useDeletePermissionHandler(deletePermission?.id ?? "");

  const allPermissions = useMemo(
    () => (data?.data?.permissions ?? []).filter((p) => p.status !== "deleted"),
    [data?.data?.permissions]
  );

  const filteredPermissions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allPermissions.filter((permission) => {
      if (statusFilter === "active" && permission.status !== "active")
        return false;
      if (statusFilter === "inactive" && permission.status !== "inactive")
        return false;
      if (query) {
        const matches =
          permission.display_name.toLowerCase().includes(query) ||
          permission.slug.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [allPermissions, statusFilter, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPermissions.length / PAGE_SIZE)
  );
  const paginatedPermissions = filteredPermissions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const handleCreate = () => {
    setEditingPermission(undefined);
    setFormOpen(true);
  };

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingPermission(undefined);
    mutate();
  };

  const handleDeleteConfirm = async () => {
    if (!deletePermission) return;
    try {
      const result = await deleteTrigger(null);
      if (result?.status === 200) {
        toast.success(`Permiso "${deletePermission.display_name}" eliminado.`);
        setDeletePermission(undefined);
        mutate();
      } else if (result?.status === 409) {
        toast.error(
          "No se puede eliminar: el permiso está asignado a uno o más roles."
        );
      } else {
        toast.error("Error al eliminar el permiso.");
      }
    } catch {
      toast.error("Error al eliminar el permiso.");
    }
  };

  function handleStatusChange(value: StatusFilter | null) {
    setStatusFilter(value ?? "all");
    setPage(1);
  }

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("all");
    setPage(1);
  }

  return (
    <section
      aria-label="Permisos"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            render={<Link to="/team/roles" />}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="size-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Permisos</h1>
          <p className="text-sm text-muted-foreground">
            Permisos del sistema asignados a roles.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus />
          Crear permiso
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="permission-search">Búsqueda</Label>
            <div className="relative">
              <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                id="permission-search"
                placeholder="Nombre o slug"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="w-72 pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="permission-status">Estatus</Label>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger id="permission-status" className="w-44">
                <SelectValue
                  placeholder="Seleccionar"
                  render={() => <span>{statusFilterLabel[statusFilter]}</span>}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">&nbsp;</span>
            <Button
              className="h-8"
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
            >
              <RotateCcw /> Limpiar
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : paginatedPermissions.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {search || statusFilter !== "all"
                ? "No hay permisos que coincidan con los filtros."
                : "No hay permisos registrados."}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPermissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell className="font-medium">
                        {permission.display_name}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {permission.slug}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            permission.status === "active"
                              ? "default"
                              : "secondary"
                          }
                          className="gap-1"
                        >
                          {permission.status === "active" ? (
                            <CircleCheck className="size-3" />
                          ) : (
                            <CircleX className="size-3" />
                          )}
                          {permission.status === "active"
                            ? "Activo"
                            : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {permission.description || "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon-sm" />}
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEdit(permission)}
                            >
                              <Pencil className="size-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeletePermission(permission)}
                            >
                              <Trash2 className="size-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <CreatePermissionDialog
        open={formOpen}
        onOpenChange={(next) => {
          setFormOpen(next);
          if (!next) setEditingPermission(undefined);
        }}
        permission={editingPermission}
        onSuccess={handleFormSuccess}
      />

      {deletePermission && (
        <DeletePermissionDialog
          open={!!deletePermission}
          onOpenChange={(next) => !next && setDeletePermission(undefined)}
          permission={deletePermission}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      )}
    </section>
  );
}
