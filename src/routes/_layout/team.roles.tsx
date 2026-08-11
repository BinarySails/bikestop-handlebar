import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { useDeleteRoleHandler, useListRolesHandler } from "@/lib/api/api";
import type { Role } from "@/lib/api/schemas";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { AssignPermissionsDialog } from "@/components/features/rbac/assign-permissions-dialog";
import { CreateRoleDialog } from "@/components/features/rbac/create-role-dialog";
import { DeleteRoleDialog } from "@/components/features/rbac/delete-role-dialog";
import { RolePermissionsDialog } from "@/components/features/rbac/role-permissions-dialog";

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

function RoleActions({
  role,
  onView,
  onEdit,
  onDelete,
}: {
  role: Role;
  onView: (role: Role) => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Acciones de ${role.display_name}`}
          />
        }
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(role)}>
          <Eye /> Ver permisos
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(role)}>
          <Pencil /> Editar
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(role)}>
          <Trash2 /> Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatusBadge({ status }: { status: Role["status"] }) {
  return (
    <Badge
      variant={status === "active" ? "default" : "secondary"}
      className="gap-1"
    >
      {status === "active" ? (
        <CircleCheck className="size-3" />
      ) : (
        <CircleX className="size-3" />
      )}
      {status === "active" ? "Activo" : "Inactivo"}
    </Badge>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3" aria-label="Cargando roles">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}

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

  const { data, isLoading, isValidating, error, mutate } =
    useListRolesHandler();
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
  const hasError = Boolean(error || (data && data.status !== 200));
  const hasFilters = Boolean(search) || statusFilter !== "all";

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
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
          <p className="text-sm text-muted-foreground">
            Administra los roles del sistema y sus niveles de acceso.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus /> Crear Rol
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4" /> Catálogo de roles
          </CardTitle>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                className="pl-9"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                aria-label="Buscar roles"
                placeholder="Buscar por nombre o slug"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-40" aria-label="Filtrar por estado">
                  <SelectValue
                    render={() => (
                      <span>{statusFilterLabel[statusFilter]}</span>
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                aria-label="Limpiar filtros"
              >
                <RotateCcw />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState />
          ) : hasError ? (
            <div role="alert" className="space-y-3 py-10 text-center">
              <p className="font-medium">No se pudieron cargar los roles.</p>
              <p className="text-sm text-muted-foreground">
                Ocurrió un error al consultar el catálogo de roles.
              </p>
              <Button variant="outline" onClick={() => mutate()}>
                Reintentar
              </Button>
            </div>
          ) : paginatedRoles.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-medium">
                {hasFilters
                  ? "No hay roles que coincidan con los filtros."
                  : "No hay roles registrados."}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasFilters
                  ? "Prueba con otros filtros."
                  : "Crea el primer rol para comenzar."}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <Table aria-label="Listado de roles">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-12">
                        <span className="sr-only">Acciones</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRoles.map((role) => (
                      <TableRow
                        key={role.id}
                        className="cursor-pointer"
                        onClick={() => handleRowClick(role)}
                      >
                        <TableCell className="py-4 font-medium">
                          {role.display_name}
                        </TableCell>
                        <TableCell className="py-4 font-mono text-muted-foreground">
                          {role.slug}
                        </TableCell>
                        <TableCell className="py-4">
                          <StatusBadge status={role.status} />
                        </TableCell>
                        <TableCell
                          className="py-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <RoleActions
                            role={role}
                            onView={handleRowClick}
                            onEdit={handleEdit}
                            onDelete={() => setDeleteRole(role)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="grid gap-3 md:hidden">
                {paginatedRoles.map((role) => (
                  <article
                    key={role.id}
                    className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold tracking-tight">
                        {role.display_name}
                      </h3>
                      <p className="mt-0.5 truncate font-mono text-sm text-muted-foreground">
                        {role.slug}
                      </p>
                      <div className="mt-2">
                        <StatusBadge status={role.status} />
                      </div>
                    </div>
                    <RoleActions
                      role={role}
                      onView={handleRowClick}
                      onEdit={handleEdit}
                      onDelete={() => setDeleteRole(role)}
                    />
                  </article>
                ))}
              </div>
              {isValidating && allRoles.length > 0 && (
                <p
                  className="mt-3 text-xs text-muted-foreground"
                  aria-live="polite"
                >
                  Actualizando roles…
                </p>
              )}
            </>
          )}

          {!isLoading && !hasError && filteredRoles.length > 0 && (
            <nav
              aria-label="Paginación de roles"
              className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages} · {filteredRoles.length} roles
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft /> Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Siguiente <ChevronRight />
                </Button>
              </div>
            </nav>
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
