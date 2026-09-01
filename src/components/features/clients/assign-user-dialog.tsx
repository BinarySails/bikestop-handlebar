import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import {
  useCreateUserRequest,
  useListRolesHandler,
  useUpdateCustomerRequest,
} from "@/lib/api/api";
import { CreateUserRequestBody } from "@/lib/api/zods";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaginatedCustomerSummaryDataItem } from "@/lib/api/schemas";

type AssignUserDialogProps = {
  customer: PaginatedCustomerSummaryDataItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned: () => void;
};

export function AssignUserDialog({
  customer,
  open,
  onOpenChange,
  onAssigned,
}: AssignUserDialogProps) {
  const { trigger: createUser } = useCreateUserRequest();
  const { trigger: updateCustomer } = useUpdateCustomerRequest(customer.id);
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
      email: customer.email ?? "",
      username: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      if (!clientRoleId) {
        toast.error("No se encontró el rol de cliente.");
        return;
      }

      const userResult = await createUser({
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

      const userId = (userResult as { data: { id: string } }).data.id;

      const patchResult = await updateCustomer({ user_id: userId });

      if (patchResult.status === 200) {
        toast.success(`Usuario asignado a "${customer.company_name}".`);
        form.reset();
        onOpenChange(false);
        onAssigned?.();
      } else {
        toast.error("Usuario creado pero no se pudo asignar al cliente.");
      }
    },
  });

  const validateRequired = (label: string, value: string) => {
    if (!value.trim()) return `${label} es requerido`;
    return undefined;
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Email es requerido";
    const res = CreateUserRequestBody.shape.email.safeParse(value);
    return res.success ? undefined : res.error.issues[0].message;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (nextOpen) form.reset();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Asignar usuario</DialogTitle>
          <DialogDescription>
            Crea un usuario de acceso para{" "}
            <span className="font-medium">{customer.company_name}</span>.
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
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) => validateRequired("Nombre", value),
              onSubmit: ({ value }) => validateRequired("Nombre", value),
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={`assign-${field.name}`}>Nombre</Label>
                <Input
                  id={`assign-${field.name}`}
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
                <Label htmlFor={`assign-${field.name}`}>Apellido Paterno</Label>
                <Input
                  id={`assign-${field.name}`}
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
                <Label htmlFor={`assign-${field.name}`}>Apellido Materno</Label>
                <Input
                  id={`assign-${field.name}`}
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
            name="email"
            validators={{
              onChange: ({ value }) => validateEmail(value),
              onSubmit: ({ value }) => validateEmail(value),
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={`assign-${field.name}`}>Email</Label>
                <Input
                  id={`assign-${field.name}`}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="juan.perez@example.com"
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
                return res.success ? undefined : res.error.issues[0].message;
              },
              onSubmit: ({ value }) => {
                if (!value.trim()) return "Nombre de usuario es requerido";
                const res =
                  CreateUserRequestBody.shape.username.safeParse(value);
                return res.success ? undefined : res.error.issues[0].message;
              },
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={`assign-${field.name}`}>
                  Nombre de Usuario
                </Label>
                <Input
                  id={`assign-${field.name}`}
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
                <Label htmlFor={`assign-${field.name}`}>Contraseña</Label>
                <Input
                  id={`assign-${field.name}`}
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>

            <form.Subscribe selector={(state) => [state.isSubmitting]}>
              {([isSubmitting]) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creando..." : "Asignar usuario"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
