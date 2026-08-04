import { useState, useMemo } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Pencil,
  Trash2,
  CircleCheck,
  CircleX,
  MoreHorizontal,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

import {
  useListPermissionsHandler,
  useDeletePermissionHandler,
} from "@/lib/api/api";
import type { Permission } from "@/lib/api/schemas";

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
import { CreatePermissionDialog } from "@/components/features/rbac/create-permission-dialog";
import { DeletePermissionDialog } from "@/components/features/rbac/delete-permission-dialog";

export const Route = createFileRoute("/_layout/team/permisos")({
  component: PermissionsPage,
});

const PAGE_SIZE = 10;

function PermissionsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<
    Permission | undefined
  >(undefined);
  const [deletePermission, setDeletePermission] = useState<
    Permission | undefined
  >(undefined);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, mutate } = useListPermissionsHandler();
  const { trigger: deleteTrigger, isMutating: isDeleting } =
    useDeletePermissionHandler(deletePermission?.id ?? "");

  const allPermissions = useMemo(
    () => (data?.data?.permissions ?? []).filter((p) => p.status !== "deleted"),
    [data?.data?.permissions]
  );

  const filteredPermissions = useMemo(() => {
    if (activeTab === "active")
      return allPermissions.filter((p) => p.status === "active");
    if (activeTab === "inactive")
      return allPermissions.filter((p) => p.status === "inactive");
    return allPermissions;
  }, [allPermissions, activeTab]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPermissions.length / PAGE_SIZE)
  );
  const paginatedPermissions = filteredPermissions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

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

  return (
    <main className="container mx-auto max-w-5xl p-6">
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
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v);
          setPage(1);
        }}
        className="mt-6"
      >
        <TabsList>
          <TabsTrigger value="all">Todos ({allPermissions.length})</TabsTrigger>
          <TabsTrigger value="active">
            Activos (
            {allPermissions.filter((p) => p.status === "active").length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactivos (
            {allPermissions.filter((p) => p.status === "inactive").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : paginatedPermissions.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No hay permisos{" "}
                {activeTab === "active"
                  ? "activos"
                  : activeTab === "inactive"
                    ? "inactivos"
                    : "registrados"}
                .
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
            </div>
          )}
        </TabsContent>
      </Tabs>

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
    </main>
  );
}
