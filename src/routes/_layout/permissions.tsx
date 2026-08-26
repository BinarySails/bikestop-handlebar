/* oxlint-disable react/no-unstable-nested-components -- column cells are render callbacks, not components */
import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Pencil,
  Trash2,
  CircleCheck,
  CircleX,
  MoreHorizontal,
  KeyRound,
  SearchIcon,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import {
  useListPermissionsHandler,
  useDeletePermissionHandler,
} from "@/lib/api/api";
import type { Permission } from "@/lib/api/schemas";

import { SiteHeader } from "@/components/features/layout/site-header";
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
import { CreatePermissionDialog } from "@/components/features/rbac/create-permission-dialog";
import { DeletePermissionDialog } from "@/components/features/rbac/delete-permission-dialog";

export const Route = createFileRoute("/_layout/permissions")({
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
  const [page, setPage] = useState(0);

  const { data, isLoading, mutate, error } = useListPermissionsHandler();
  const { trigger: deleteTrigger, isMutating: isDeleting } =
    useDeletePermissionHandler(deletePermission?.id ?? "");

  const allPermissions = useMemo(
    () => (data?.data?.permissions ?? []).filter((p) => p.status !== "archive"),
    [data?.data?.permissions]
  );

  const filteredPermissions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allPermissions.filter((permission) => {
      if (statusFilter === "active" && permission.status !== "enable")
        return false;
      if (statusFilter === "inactive" && permission.status !== "disable")
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

  const paginatedPermissions = filteredPermissions.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
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
    setPage(0);
  }

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("all");
    setPage(0);
  }

  const columns: EntityColumn<Permission>[] = [
    {
      header: "Nombre",
      cell: (permission) => (
        <span className="font-medium">{permission.display_name}</span>
      ),
    },
    {
      header: "Slug",
      cell: (permission) => (
        <span className="font-mono text-muted-foreground">
          {permission.slug}
        </span>
      ),
    },
    {
      header: "Estado",
      cell: (permission) => (
        <Badge
          variant={permission.status === "enable" ? "default" : "secondary"}
          className="gap-1"
        >
          {permission.status === "enable" ? (
            <CircleCheck className="size-3" />
          ) : (
            <CircleX className="size-3" />
          )}
          {permission.status === "enable" ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      header: "Descripción",
      cell: (permission) => (
        <span className="max-w-52 truncate text-muted-foreground">
          {permission.description || "—"}
        </span>
      ),
    },
    {
      header: <span className="sr-only">Acciones</span>,
      className: "w-12",
      cell: (permission) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(permission)}>
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
      ),
    },
  ];

  return (
    <>
      <SiteHeader
        title="Permisos"
        description="Permisos del sistema asignados a roles."
        backTo="/roles"
        backLabel="Volver a roles"
        actions={
          <EntityCreateButton onClick={handleCreate}>
            Crear permiso
          </EntityCreateButton>
        }
      />
      <EntityIndexPage<Permission>
        ariaLabel="Permisos"
        cardTitle={
          <EntityCardTitle icon={KeyRound}>
            Catálogo de permisos
          </EntityCardTitle>
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
        rows={paginatedPermissions}
        rowKey={(permission) => permission.id}
        loading={isLoading}
        hasError={Boolean(error)}
        errorMessage="No fue posible cargar los permisos."
        onRetry={() => mutate()}
        emptyMessage={
          search || statusFilter !== "all"
            ? "No hay permisos que coincidan con los filtros."
            : "No hay permisos registrados."
        }
        pagination={{
          mode: "page",
          total: filteredPermissions.length,
          page,
          pageSize: PAGE_SIZE,
          totalLabel: "permisos",
          onPageChange: (nextPage) => setPage(nextPage),
        }}
      />

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
    </>
  );
}
