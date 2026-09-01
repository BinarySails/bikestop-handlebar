import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import {
  useCreateCustomerRequest,
  useCreateUserRequest,
  useListRolesHandler,
} from "@/lib/api/api";
import { CreateUserRequestBody } from "@/lib/api/zods";

import { EntityCreateButton } from "@/components/features/entity/entity-create-button";
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
import { Switch } from "@/components/ui/switch";

export function CreateClientDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [createUser, setCreateUser] = useState(true);
  const { trigger: createUserRequest } = useCreateUserRequest();
  const { trigger: createCustomer } = useCreateCustomerRequest();
  const rolesQuery = useListRolesHandler();

  const clientRoleId =
    rolesQuery.data?.status === 200
      ? rolesQuery.data.data.roles.find((r) => r.slug === "client")?.id
      : undefined;

  const form = useForm({
    defaultValues: {
      name: "",
      fatherLastName: "",
      motherLastName: "",
      email: "",
      username: "",
      password: "",
      companyName: "",
      taxId: "",
      phone: "",
    },
    onSubmit: async ({ value }) => {
      let userId: string | null = null;

      if (createUser) {
        if (!clientRoleId) {
          toast.error("No se encontró el rol de cliente.");
          return;
        }

        const userResult = await createUserRequest({
          name: value.name,
          father_last_name: value.fatherLastName,
          mother_last_name: value.motherLastName,
          email: value.email,
          username: value.username,
          password: value.password,
          role_ids: [clientRoleId],
        });

        if (userResult.status !== 201) {
          const message =
            "data" in userResult
              ? (userResult as { data: { message?: string } }).data.message
              : undefined;
          toast.error(message ?? "Error al crear el usuario.");
          return;
        }

        userId = (userResult as { data: { id: string } }).data.id;
      }

      const customerResult = await createCustomer({
        company_name: value.companyName,
        tax_id: value.taxId || null,
        phone: value.phone || null,
        email: value.email || null,
        user_id: userId,
      });

      if (customerResult.status === 201) {
        toast.success(`Cliente "${value.companyName}" creado.`);
        form.reset();
        setCreateUser(true);
        setOpen(false);
        onCreated?.();
      } else {
        toast.error("Error al crear el perfil de cliente.");
      }
    },
  });

  const validateRequired = (label: string, value: string) => {
    if (!value.trim()) return `${label} es requerido`;
    return undefined;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<EntityCreateButton>Crear Cliente</EntityCreateButton>}
      />

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear Cliente</DialogTitle>
          <DialogDescription>
            Crea un perfil de empresa para un cliente.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Switch
              id="create-user"
              size="sm"
              checked={createUser}
              onCheckedChange={setCreateUser}
            />
            <Label htmlFor="create-user" className="cursor-pointer">
              Crear usuario de acceso
            </Label>
          </div>

          {createUser && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Datos del usuario
                </Label>
              </div>

              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => validateRequired("Nombre", value),
                  onSubmit: ({ value }) => validateRequired("Nombre", value),
                }}
              >
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Nombre</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Juan"
                      aria-invalid={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                          ? "true"
                          : undefined
                      }
                    />
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-red-500">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="fatherLastName"
                validators={{
                  onChange: ({ value }) =>
                    validateRequired("Apellido paterno", value),
                  onSubmit: ({ value }) =>
                    validateRequired("Apellido paterno", value),
                }}
              >
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Apellido Paterno</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Perez"
                      aria-invalid={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                          ? "true"
                          : undefined
                      }
                    />
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-red-500">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="motherLastName"
                validators={{
                  onChange: ({ value }) =>
                    validateRequired("Apellido materno", value),
                  onSubmit: ({ value }) =>
                    validateRequired("Apellido materno", value),
                }}
              >
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Apellido Materno</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Gomez"
                      aria-invalid={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                          ? "true"
                          : undefined
                      }
                    />
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-red-500">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="username"
                validators={{
                  onChange: ({ value }) => {
                    if (!value.trim()) return "Nombre de usuario es requerido";
                    if (value.length < 3)
                      return "Nombre debe de tener al menos 3 caracteres";
                    const res =
                      CreateUserRequestBody.shape.username.safeParse(value);
                    return res.success
                      ? undefined
                      : res.error.issues[0].message;
                  },
                  onSubmit: ({ value }) => {
                    if (!value.trim()) return "Nombre de usuario es requerido";
                    const res =
                      CreateUserRequestBody.shape.username.safeParse(value);
                    return res.success
                      ? undefined
                      : res.error.issues[0].message;
                  },
                }}
              >
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Nombre de Usuario</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="juanperez"
                      aria-invalid={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                          ? "true"
                          : undefined
                      }
                    />
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-red-500">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="password"
                validators={{
                  onChange: ({ value }) => {
                    const result =
                      CreateUserRequestBody.shape.password.safeParse(value);
                    if (!result.success) return result.error.issues[0].message;
                    if (value.length < 12)
                      return "La contraseña debe de tener al menos 12 caracteres";
                    if (!/[A-Z]/.test(value))
                      return "La contraseña debe de tener al menos una mayúscula";
                    if (!/[0-9]/.test(value))
                      return "La contraseña debe de tener al menos un dígito";
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Contraseña</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="••••••••••••"
                      aria-invalid={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                          ? "true"
                          : undefined
                      }
                    />
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-red-500">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
            </div>
          )}

          <div className="grid gap-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Datos de la empresa
            </Label>
          </div>

          <form.Field
            name="companyName"
            validators={{
              onChange: ({ value }) =>
                validateRequired("Nombre de empresa", value),
              onSubmit: ({ value }) =>
                validateRequired("Nombre de empresa", value),
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Nombre de Empresa</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Mi Empresa SA de CV"
                  aria-invalid={
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                      ? "true"
                      : undefined
                  }
                />
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-red-500">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                if (!createUser && !value.trim()) return "Email es requerido";
                if (!value.trim()) return undefined;
                const res = CreateUserRequestBody.shape.email.safeParse(value);
                return res.success ? undefined : res.error.issues[0].message;
              },
              onSubmit: ({ value }) => {
                if (!createUser && !value.trim()) return "Email es requerido";
                if (!value.trim()) return undefined;
                const res = CreateUserRequestBody.shape.email.safeParse(value);
                return res.success ? undefined : res.error.issues[0].message;
              },
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>
                  Email {createUser ? "(del usuario)" : ""}
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="empresa@example.com"
                  aria-invalid={
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                      ? "true"
                      : undefined
                  }
                />
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-red-500">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="taxId">
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>RFC (opcional)</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="XAXX010101000"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="phone">
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Teléfono (opcional)</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="5555555555"
                />
              </div>
            )}
          </form.Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>

            <form.Subscribe selector={(state) => [state.isSubmitting]}>
              {([isSubmitting]) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creando..." : "Crear Cliente"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
