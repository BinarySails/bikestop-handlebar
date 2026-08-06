import { useState, useMemo } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Pencil,
  Trash2,
  Plus,
  CircleCheck,
  CircleX,
  MoreHorizontal,
  ArrowLeft,
  Search,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import { useListRolesHandler, useDeleteRoleHandler } from "@/lib/api/api";
import type { Role } from "@/lib/api/schemas";

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
import { CreateRoleDialog } from "@/components/features/rbac/create-role-dialog";
import { DeleteRoleDialog } from "@/components/features/rbac/delete-role-dialog";
import { RolePermissionsDialog } from "@/components/features/rbac/role-permissions-dialog";
import { AssignPermissionsDialog } from "@/components/features/rbac/assign-permissions-dialog";

export const Route = createFileRoute("/_layout/team/roles")({
  component: RolesPage,
});

const PAGE_SIZE = 10;

type StatusFilter = "all" | "active" | "inactive";

const statusFilterLabel: Record<StatusFilter, string> = {
  all: "Todos",
  active: "Activos",
  inactive: "Inactivos",
};

function RolesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);
  const [deleteRole, setDeleteRole] = useState<Role | undefined>(undefined);
  const [viewingRolePermissions, setViewingRolePermissions] =
    useState<Role | null>(null);
  const [assigningRole, setAssigningRole] = useState<Role | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, mutate } = useListRolesHandler();
  const { trigger: deleteTrigger, isMutating: isDeleting } =
    useDeleteRoleHandler(deleteRole?.id ?? "");

  const allRoles = useMemo(
    () => (data?.data?.roles ?? []).filter((r) => r.status !== "deleted"),
    [data?.data?.roles]
  );

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allRoles.filter((role) => {
      if (statusFilter === "active" && role.status !== "active") return false;
      if (statusFilter === "inactive" && role.status !== "inactive")
        return false;
      if (query) {
        const matches =
          role.display_name.toLowerCase().includes(query) ||
          role.slug.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [allRoles, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / PAGE_SIZE));
  const paginatedRoles = filteredRoles.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const handleCreate = () => {
    setEditingRole(undefined);
    setFormOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRole) return;
    try {
      const result = await deleteTrigger(null);
      if (result?.status === 200) {
        toast.success(`Rol "${deleteRole.display_name}" eliminado.`);
        setDeleteRole(undefined);
        mutate();
      } else if (result?.status === 409) {
        toast.error("No se puede eliminar: el rol tiene usuarios asignados.");
      } else {
        toast.error("Error al eliminar el rol.");
      }
    } catch {
      toast.error("Error al eliminar el rol.");
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingRole(undefined);
    mutate();
  };

  const handleRowClick = (role: Role) => {
    setViewingRolePermissions(role);
  };

  const handleOpenAssign = () => {
    if (viewingRolePermissions) {
      setAssigningRole(viewingRolePermissions);
      setViewingRolePermissions(null);
    }
  };

  const handleBackToView = () => {
    if (assigningRole) {
      setViewingRolePermissions(assigningRole);
      setAssigningRole(null);
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
      aria-label="Roles"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            render={<Link to="/team" />}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="size-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
          <p className="text-sm text-muted-foreground">
            Administra los roles del sistema y sus niveles de acceso.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus />
          Crear Rol
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role-search">Búsqueda</Label>
            <div className="relative">
              <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                id="role-search"
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
            <Label htmlFor="role-status">Estatus</Label>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger id="role-status" className="w-44">
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
          ) : paginatedRoles.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {search || statusFilter !== "all"
                ? "No hay roles que coincidan con los filtros."
                : "No hay roles registrados."}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRoles.map((role) => (
                    <TableRow
                      key={role.id}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(role)}
                    >
                      <TableCell className="font-medium">
                        {role.display_name}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {role.slug}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            role.status === "active" ? "default" : "secondary"
                          }
                          className="gap-1"
                        >
                          {role.status === "active" ? (
                            <CircleCheck className="size-3" />
                          ) : (
                            <CircleX className="size-3" />
                          )}
                          {role.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon-sm" />}
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(role)}>
                              <Pencil className="size-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteRole(role)}
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

      <CreateRoleDialog
        open={formOpen}
        onOpenChange={(next) => {
          setFormOpen(next);
          if (!next) setEditingRole(undefined);
        }}
        role={editingRole}
        onSuccess={handleFormSuccess}
      />

      {deleteRole && (
        <DeleteRoleDialog
          open={!!deleteRole}
          onOpenChange={(next) => !next && setDeleteRole(undefined)}
          role={deleteRole}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      )}

      <RolePermissionsDialog
        open={!!viewingRolePermissions}
        onOpenChange={(next) => !next && setViewingRolePermissions(null)}
        role={viewingRolePermissions}
        onOpenAssign={handleOpenAssign}
      />

      <AssignPermissionsDialog
        open={!!assigningRole}
        onOpenChange={(next) => !next && setAssigningRole(null)}
        role={assigningRole}
        onBack={handleBackToView}
      />
    </section>
  );
}
