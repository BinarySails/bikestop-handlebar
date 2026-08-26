import { RefreshCw } from "lucide-react";

import { useGetUserPermissionsHandler } from "@/lib/api/api";
import type { Permission } from "@/lib/api/schemas";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function getModule(slug: string): string {
  return slug.includes(".") ? slug.split(".")[0] : "general";
}

function getCodeLabel(slug: string): string {
  return slug.includes(".") ? slug.split(".").slice(1).join(".") : slug;
}

interface UserPermissionsTableProps {
  userId: string;
}

export function UserPermissionsTable({ userId }: UserPermissionsTableProps) {
  const { data, error, isLoading, isValidating, mutate } =
    useGetUserPermissionsHandler(userId, {
      swr: {
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      },
    });

  const response = data?.status === 200 ? data : undefined;
  const permissions = response?.data?.permissions ?? [];

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <p className="text-sm font-medium">Permisos Asignados</p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => mutate()}
          disabled={isValidating}
          aria-label="Actualizar permisos"
        >
          <RefreshCw className={cn("size-4", isValidating && "animate-spin")} />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : error || (data && data.status !== 200) ? (
        <div className="p-4">
          <p className="text-sm text-destructive">
            Error al cargar los permisos.
          </p>
        </div>
      ) : permissions.length === 0 ? (
        <div className="p-4">
          <p className="text-sm text-muted-foreground">
            Este usuario no tiene permisos asignados.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Módulo</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((permission: Permission) => (
              <TableRow key={permission.id}>
                <TableCell className="font-medium">
                  {permission.display_name}
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {getCodeLabel(permission.slug)}
                </TableCell>
                <TableCell className="capitalize">
                  {getModule(permission.slug)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      permission.status === "enable" ? "default" : "secondary"
                    }
                  >
                    {permission.status === "enable" ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
