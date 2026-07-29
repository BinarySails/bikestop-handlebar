import { useState } from "react";
import { RefreshCw, UserIcon } from "lucide-react";
import { toast } from "sonner";

import { useGetUserPermissions } from "@/lib/api/permissions";
import type { Permission } from "@/lib/api/permissions";

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
    const module = permission.code.includes(".")
      ? permission.code.split(".")[0]
      : "general";
    acc[module] = acc[module] ? [...acc[module], permission] : [permission];
    return acc;
  }, {});
}

function getCodeLabel(code: string): string {
  return code.includes(".") ? code.split(".").slice(1).join(".") : code;
}

export function ConsultUserPermissionsDialog() {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");

  const {
    data,
    isLoading,
    isValidating,
    mutate,
  } = useGetUserPermissions(userId || null, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const permissionsByModule = data ? groupByModule(data.permissions) : {};

  const handleSearch = async () => {
    if (!userId.trim()) {
      toast.error("Ingresa un ID de usuario");
      return;
    }
    try {
      const result = await mutate();
      if (!result || !result.permissions?.length) {
        toast.info("El usuario no tiene permisos asignados");
      }
    } catch {
      toast.error("Error al consultar permisos. Verifica que el backend esté corriendo.");
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setUserId("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger>
        <Button>
          Consultar Permisos
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

          {data && (
            <>
              <Separator />

              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserIcon className="size-4" />
                  <span className="font-mono text-xs">{data.user_id}</span>
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
                ) : Object.keys(permissionsByModule).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Este usuario no tiene permisos asignados actualmente.
                  </p>
                ) : (
                  Object.entries(permissionsByModule).map(([module, permissions]) => (
                    <div key={module} className="grid gap-2">
                      <p className="text-sm font-medium capitalize">{module}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {permissions.map((permission) => (
                          <Badge
                            key={permission.id}
                            variant="outline"
                            title={permission.description}
                          >
                            {getCodeLabel(permission.code)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
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
