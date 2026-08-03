import { useMemo } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import {
  useListRolesHandler,
  useListPermissionsHandler,
  useListRolePermissionsHandler,
  useAssignPermissionsHandler,
  useRemovePermissionsHandler,
} from "@/lib/api/api";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

export const Route = createFileRoute("/_layout/team/roles/$roleId/permissions")(
  {
    component: RolePermissionsPage,
  }
);

function RolePermissionsPage() {
  const { roleId } = Route.useParams();

  const { data: rolesData, isLoading: rolesLoading } = useListRolesHandler();
  const { data: permissionsData, isLoading: permissionsLoading } =
    useListPermissionsHandler();
  const {
    data: rolePermissionsData,
    isLoading: rolePermsLoading,
    mutate: mutateRolePerms,
  } = useListRolePermissionsHandler(roleId);

  const { trigger: assignTrigger, isMutating: isAssigning } =
    useAssignPermissionsHandler(roleId);
  const { trigger: removeTrigger, isMutating: isRemoving } =
    useRemovePermissionsHandler(roleId);

  const role = useMemo(
    () => rolesData?.data?.roles?.find((r) => r.id === roleId),
    [rolesData, roleId]
  );

  const allPermissions = permissionsData?.data?.permissions ?? [];
  const assignedPermissions = rolePermissionsData?.data?.permissions ?? [];
  const assignedIds = useMemo(
    () => new Set(assignedPermissions.map((p) => p.id)),
    [assignedPermissions]
  );

  const isMutating = isAssigning || isRemoving;
  const isLoading = rolesLoading || permissionsLoading || rolePermsLoading;

  const handleToggle = async (permissionId: string, assign: boolean) => {
    if (isMutating) return;

    try {
      if (assign) {
        const result = await assignTrigger({ permission_ids: [permissionId] });
        if (result.status !== 200) {
          toast.error("Error al asignar permiso.");
          return;
        }
      } else {
        const result = await removeTrigger({ permission_ids: [permissionId] });
        if (result.status !== 200) {
          toast.error("Error al remover permiso.");
          return;
        }
      }
      mutateRolePerms();
    } catch {
      toast.error("Error al actualizar permiso.");
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
            Volver a Roles
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            Asignar Permisos
          </h1>
          <p className="text-sm text-muted-foreground">
            {rolesLoading ? (
              <Skeleton className="inline-block h-4 w-48" />
            ) : (
              <>
                Permisos asignados al rol{" "}
                <span className="font-medium text-foreground">
                  {role?.display_name ?? "—"}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : allPermissions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No hay permisos disponibles.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Activo</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Slug</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPermissions.map((permission) => {
                const isChecked = assignedIds.has(permission.id);
                return (
                  <TableRow
                    key={permission.id}
                    className="cursor-pointer"
                    onClick={() => {
                      if (!isMutating) {
                        handleToggle(permission.id, !isChecked);
                      }
                    }}
                  >
                    <TableCell>
                      <Checkbox checked={isChecked} disabled={isMutating} />
                    </TableCell>
                    <TableCell className="font-medium">
                      {permission.display_name}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {permission.slug}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </main>
  );
}
