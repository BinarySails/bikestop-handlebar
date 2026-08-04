import { useEffect, useMemo, useState } from "react";
import { EyeIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateUserRequest } from "@/lib/api/api";
import type {
  Role,
  UpdateUserRequest,
  UserWithRolesResponse,
} from "@/lib/api/schemas";

type EditUserDialogProps = {
  user: UserWithRolesResponse;
  roles: Role[];
  archived: boolean;
  onUpdated: () => void;
};

function errorMessage(status: number, fallback?: string | null) {
  if (status === 400) return fallback ?? "Revisa los datos ingresados.";
  if (status === 404) return "El usuario ya no existe.";
  if (status === 409) return fallback ?? "El correo o usuario ya está en uso.";
  return fallback ?? "No fue posible actualizar el usuario.";
}

export function EditUserDialog({
  user,
  roles,
  archived,
  onUpdated,
}: EditUserDialogProps) {
  const isClient = user.roles.some((role) => role.slug === "client");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [fatherLastName, setFatherLastName] = useState(user.father_last_name);
  const [motherLastName, setMotherLastName] = useState(
    user.mother_last_name ?? ""
  );
  const [email, setEmail] = useState(user.email);
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(user.status);
  const [roleIds, setRoleIds] = useState<string[]>(
    user.roles.map((role) => role.id)
  );
  const { trigger, isMutating } = useUpdateUserRequest(user.id);

  useEffect(() => {
    if (!open) return;
    setName(user.name);
    setFatherLastName(user.father_last_name);
    setMotherLastName(user.mother_last_name ?? "");
    setEmail(user.email);
    setUsername(user.username);
    setPassword("");
    setStatus(user.status);
    setRoleIds(user.roles.map((role) => role.id));
  }, [open, user]);

  const changes = useMemo<UpdateUserRequest>(() => {
    const next: UpdateUserRequest = {};
    if (name !== user.name) next.name = name;
    if (fatherLastName !== user.father_last_name)
      next.father_last_name = fatherLastName;
    if (motherLastName !== (user.mother_last_name ?? ""))
      next.mother_last_name = motherLastName || null;
    if (email !== user.email) next.email = email;
    if (username !== user.username) next.username = username;
    if (password) next.password = password;
    if (status !== user.status) next.status = status;

    const originalRoles = user.roles.map((role) => role.id).sort();
    const nextRoles = [...roleIds].sort();
    if (originalRoles.join(",") !== nextRoles.join(","))
      next.role_ids = roleIds;
    return next;
  }, [
    email,
    fatherLastName,
    motherLastName,
    name,
    password,
    roleIds,
    status,
    user,
    username,
  ]);

  const hasChanges = Object.keys(changes).length > 0;

  async function submit(payload: UpdateUserRequest = changes) {
    const result = await trigger(payload);
    if (result.status === 200) {
      toast.success("Usuario actualizado.");
      setOpen(false);
      onUpdated();
      return;
    }
    toast.error(
      errorMessage(
        result.status,
        "message" in result.data ? result.data.message : null
      )
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Ver y editar ${user.username}`}
          />
        }
      >
        <EyeIcon className="size-5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>
            Actualiza únicamente los campos que necesites cambiar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={`name-${user.id}`}>Nombre</Label>
            <Input
              id={`name-${user.id}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`father-${user.id}`}>Apellido paterno</Label>
            <Input
              id={`father-${user.id}`}
              value={fatherLastName}
              onChange={(event) => setFatherLastName(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`mother-${user.id}`}>Apellido materno</Label>
            <Input
              id={`mother-${user.id}`}
              value={motherLastName}
              onChange={(event) => setMotherLastName(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`email-${user.id}`}>Correo</Label>
            <Input
              id={`email-${user.id}`}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`username-${user.id}`}>Usuario</Label>
            <Input
              id={`username-${user.id}`}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`password-${user.id}`}>Nueva contraseña</Label>
            <Input
              id={`password-${user.id}`}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Dejar vacío para conservar"
            />
          </div>
          <div className="grid gap-2">
            <Label>Estado</Label>
            <Select
              value={status}
              onValueChange={(value) => value && setStatus(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!isClient && (
            <div className="grid gap-2 sm:col-span-2">
              <Label>Roles</Label>
              <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={roleIds.includes(role.id)}
                      onCheckedChange={(checked) =>
                        setRoleIds((current) =>
                          checked
                            ? [...current, role.id]
                            : current.filter((id) => id !== role.id)
                        )
                      }
                    />
                    {role.display_name}
                  </label>
                ))}
                {roles.length === 0 && (
                  <span className="text-sm text-muted-foreground">
                    No hay roles disponibles.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="justify-between sm:justify-between">
          <Button
            type="button"
            variant={archived ? "outline" : "destructive"}
            disabled={isMutating}
            onClick={() => submit({ status: archived ? "active" : "inactive" })}
          >
            {archived ? "Reactivar" : "Archivar"}
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!hasChanges || isMutating}
              onClick={() => submit()}
            >
              {isMutating ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
