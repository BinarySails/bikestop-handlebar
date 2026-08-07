import { useMemo, useState, type FormEvent } from "react";
import { ArchiveIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

type UserEditFormProps = {
  user: UserWithRolesResponse;
  roles: Role[];
  onCancel: () => void;
  onSaved: () => void;
};

function errorMessage(status: number, fallback?: string | null) {
  if (status === 400) return fallback ?? "Revisa los datos ingresados.";
  if (status === 404) return "El usuario ya no existe.";
  if (status === 409) return fallback ?? "El correo o usuario ya está en uso.";
  return fallback ?? "No fue posible actualizar el usuario.";
}

export function UserEditForm({
  user,
  roles,
  onCancel,
  onSaved,
}: UserEditFormProps) {
  const isClient = user.roles.some((role) => role.slug === "client");
  const archived = user.status === "inactive";
  const [name, setName] = useState(user.name);
  const [fatherLastName, setFatherLastName] = useState(user.father_last_name);
  const [motherLastName, setMotherLastName] = useState(
    user.mother_last_name ?? ""
  );
  const [email, setEmail] = useState(user.email);
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(user.status);
  const [roleIds, setRoleIds] = useState(user.roles.map((role) => role.id));
  const { trigger, isMutating } = useUpdateUserRequest(user.id);

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

  async function submit(payload: UpdateUserRequest) {
    const result = await trigger(payload);
    if (result.status === 200) {
      toast.success("Usuario actualizado.");
      onSaved();
      return;
    }
    toast.error(
      errorMessage(
        result.status,
        "message" in result.data ? result.data.message : null
      )
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (Object.keys(changes).length > 0) void submit(changes);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del usuario</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="user-name">Nombre</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-father-last-name">Apellido paterno</Label>
              <Input
                id="user-father-last-name"
                value={fatherLastName}
                onChange={(event) => setFatherLastName(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-mother-last-name">Apellido materno</Label>
              <Input
                id="user-mother-last-name"
                value={motherLastName}
                onChange={(event) => setMotherLastName(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-email">Correo</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-username">Usuario</Label>
              <Input
                id="user-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-password">Nueva contraseña</Label>
              <Input
                id="user-password"
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
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse justify-between gap-3 border-t pt-5 sm:flex-row">
            <Button
              type="button"
              variant={archived ? "outline" : "destructive"}
              disabled={isMutating}
              onClick={() =>
                submit({ status: archived ? "active" : "inactive" })
              }
            >
              {archived ? <RotateCcwIcon /> : <ArchiveIcon />}
              {archived ? "Reactivar" : "Archivar"}
            </Button>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={Object.keys(changes).length === 0 || isMutating}
              >
                {isMutating ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
