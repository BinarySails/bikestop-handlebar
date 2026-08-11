/* oxlint-disable react/no-unstable-nested-components -- column cells are render callbacks, not components */
import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Pencil,
  Trash2,
  CircleCheck,
  CircleX,
  MoreHorizontal,
  SearchIcon,
  RotateCcw,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

import { useListRolesHandler, useDeleteRoleHandler } from "@/lib/api/api";
import type { Role } from "@/lib/api/schemas";

import { EntityCardTitle } from "@/components/features/entity/entity-card-title";
import {
  EntityIndexPage,
  type EntityColumn,
} from "@/components/features/entity/entity-index-page";
import { EntityCreateButton } from "@/components/features/entity/entity-create-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export const Route = createFileRoute("/_layout/roles")({
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
  const [page, setPage] = useState(0);

  const { data, isLoading, mutate, error } = useListRolesHandler();
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

  const paginatedRoles = filteredRoles.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
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
    setPage(0);
  }

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("all");
    setPage(0);
  }

  const columns: EntityColumn<Role>[] = [
    {
      header: "Nombre",
      cell: (role) => <span className="font-medium">{role.display_name}</span>,
    },
    {
      header: "Slug",
      cell: (role) => (
        <span className="font-mono text-muted-foreground">{role.slug}</span>
      ),
    },
    {
      header: "Estado",
      cell: (role) => (
        <Badge
          variant={role.status === "active" ? "default" : "secondary"}
          className="gap-1"
        >
          {role.status === "active" ? (
            <CircleCheck className="size-3" />
          ) : (
            <CircleX className="size-3" />
          )}
          {role.status === "active" ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      header: <span className="sr-only">Acciones</span>,
      className: "w-12",
      cell: (role) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(event) => event.stopPropagation()}
              />
            }
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
      ),
    },
  ];

  return (
    <>
      <EntityIndexPage<Role>
        ariaLabel="Roles"
        title="Roles"
        description="Administra los roles del sistema y sus niveles de acceso."
        headerActions={
          <EntityCreateButton onClick={handleCreate}>
            Crear Rol
          </EntityCreateButton>
        }
        cardTitle={
          <EntityCardTitle icon={Shield}>Catálogo de roles</EntityCardTitle>
        }
        cardHeaderExtras={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <InputGroup className="w-full max-w-xl">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
                placeholder="Buscar por nombre o slug"
                aria-label="Buscar por nombre o slug"
              />
            </InputGroup>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Estatus</span>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  handleStatusChange(value as StatusFilter)
                }
              >
                <SelectTrigger size="sm" className="min-w-36">
                  <SelectValue>{statusFilterLabel[statusFilter]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={handleClearFilters}
              >
                <RotateCcw />
                Limpiar
              </Button>
            </div>
          </div>
        }
        columns={columns}
        rows={paginatedRoles}
        rowKey={(role) => role.id}
        onRowClick={handleRowClick}
        loading={isLoading}
        hasError={Boolean(error)}
        errorMessage="No fue posible cargar los roles."
        onRetry={() => mutate()}
        emptyMessage={
          search || statusFilter !== "all"
            ? "No hay roles que coincidan con los filtros."
            : "No hay roles registrados."
        }
        pagination={{
          mode: "page",
          total: filteredRoles.length,
          page,
          pageSize: PAGE_SIZE,
          totalLabel: "roles",
          onPageChange: (nextPage) => setPage(nextPage),
        }}
      />

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
    </>
  );
}
