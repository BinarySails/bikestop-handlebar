import { useState, useMemo } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Pencil, Trash2, Plus, CircleCheck, CircleX, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import {
  useListRolesHandler,
  useDeleteRoleHandler,
} from "@/lib/api/api";
import type { Role } from "@/lib/api/schemas";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

function RolesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);
  const [deleteRole, setDeleteRole] = useState<Role | undefined>(undefined);
  const [viewingRolePermissions, setViewingRolePermissions] = useState<Role | null>(null);
  const [assigningRole, setAssigningRole] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, mutate } = useListRolesHandler();
  const { trigger: deleteTrigger, isMutating: isDeleting } = useDeleteRoleHandler(deleteRole?.id ?? "");

  const allRoles = useMemo(() => data?.data?.roles ?? [], [data?.data?.roles]);

  const filteredRoles = useMemo(() => {
    if (activeTab === "active") return allRoles.filter((r) => r.status === "active");
    if (activeTab === "inactive") return allRoles.filter((r) => r.status !== "active");
    return allRoles;
  }, [allRoles, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / PAGE_SIZE));
  const paginatedRoles = filteredRoles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  return (
    <main className="container mx-auto max-w-5xl p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
          <p className="text-sm text-muted-foreground">
            Administra los roles del sistema y sus niveles de acceso.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            render={<Link to="/team/permisos" />}
            size="sm"
          >
            Administrar Permisos
          </Button>
          <Button onClick={handleCreate} size="sm">
            <Plus />
            Crear Rol
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }} className="mt-6">
        <TabsList>
          <TabsTrigger value="all">Todos ({allRoles.length})</TabsTrigger>
          <TabsTrigger value="active">
            Activos ({allRoles.filter((r) => r.status === "active").length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Desactivados ({allRoles.filter((r) => r.status !== "active").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="space-y-2 mt-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : paginatedRoles.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center mt-4">
              <p className="text-sm text-muted-foreground">
                No hay roles {activeTab === "active" ? "activos" : activeTab === "inactive" ? "desactivados" : "registrados"}.
              </p>
            </div>
          ) : (
            <div className="mt-4">
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
                      <TableCell className="font-medium">{role.display_name}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{role.slug}</TableCell>
                      <TableCell>
                        <Badge variant={role.status === "active" ? "default" : "secondary"} className="gap-1">
                          {role.status === "active" ? (
                            <CircleCheck className="size-3" />
                          ) : (
                            <CircleX className="size-3" />
                          )}
                          {role.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
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
                <div className="flex items-center justify-between mt-4">
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
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
    </main>
  );
}
