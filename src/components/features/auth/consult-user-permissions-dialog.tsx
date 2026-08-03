import { useState } from "react";
import { RefreshCw, UserIcon } from "lucide-react";
import { toast } from "sonner";

import { useGetUserPermissionsHandler } from "@/lib/api/api";
import type { Permission } from "@/lib/api/schemas";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function groupByModule(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce<Record<string, Permission[]>>((acc, permission) => {
    const slug = permission.slug;
    const module = slug.includes(".") ? slug.split(".")[0] : "general";
    acc[module] = acc[module] ? [...acc[module], permission] : [permission];
    return acc;
  }, {});
}

function getCodeLabel(slug: string): string {
  return slug.includes(".") ? slug.split(".").slice(1).join(".") : slug;
}

export function ConsultUserPermissionsDialog() {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [submittedId, setSubmittedId] = useState("");

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useGetUserPermissionsHandler(submittedId, {
    swr: {
      enabled: !!submittedId,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  });

  const response = data?.status === 200 ? data : undefined;
  const permissions = response?.data?.permissions ?? [];
  const permissionsByModule = groupByModule(permissions);

  const handleSearch = () => {
    if (!userId.trim()) {
      toast.error("Ingresa un ID de usuario");
      return;
    }
    setSubmittedId(userId.trim());
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setUserId("");
      setSubmittedId("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger>
        <Button size="sm">
          Ver Permisos de Usuario
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Permisos Efectivos del Usuario</DialogTitle>
          <DialogDescription>
            Ingresa el ID del usuario para consultar sus permisos efectivos en tiempo de ejecución.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="user-id">ID del Usuario</Label>
            <div className="flex gap-2">
              <Input
                id="user-id"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="12345678"
                className="font-mono"
              />
              <Button
                type="button"
                onClick={handleSearch}
                disabled={isLoading || !userId.trim()}
              >
                {isLoading ? "Consultando..." : "Consultar"}
              </Button>
            </div>
          </div>

          {submittedId && response && (
            <>
              <Separator />

              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserIcon className="size-4" />
                  <span className="font-mono text-xs">{response.data.user_id}</span>
                </div>

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

              <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-20" />
                    <div className="flex flex-wrap gap-1.5">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-14" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                    <div className="flex flex-wrap gap-1.5">
                      <Skeleton className="h-5 w-18" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                ) : permissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Este usuario no tiene permisos asignados actualmente.
                  </p>
                ) : (
                  Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
                    <div key={module} className="grid gap-2">
                      <p className="text-sm font-medium capitalize">{module}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {modulePermissions.map((permission) => (
                          <Badge
                            key={permission.id}
                            variant="outline"
                            title={permission.description ?? undefined}
                          >
                            {getCodeLabel(permission.slug)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {submittedId && !isLoading && (error || (data && data.status !== 200)) && (
            <p className="text-sm text-destructive">
              Error al consultar los permisos. Verifica que el backend esté corriendo y que el ID
              sea válido.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
