import { useState } from "react";
import { useForm, useSelector } from "@tanstack/react-form";
import { toast } from "sonner";
import { useCreateUserRequest } from "@/lib/api/api";
import { CreateUserRequestBody } from "@/lib/api/zods";

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

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const { trigger } = useCreateUserRequest();

  const form = useForm({
    defaultValues: {
      name: "",
      fatherLastName: "",
      motherLastName: "",
      email: "",
      username: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      const result = await trigger({
        name: value.name,
        father_last_name: value.fatherLastName,
        mother_last_name: value.motherLastName,
        email: value.email,
        username: value.username,
        password: value.password,
      });

      const errorData = "data" in result ? (result as { data: { message?: string } }).data : null;

      if (result.status === 201) {
        toast.success(`Usuario "${value.username}" creado.`);
        form.reset();
        setOpen(false);
      } else {
        toast.error(errorData?.message ?? "Error al crear usuario.");
      }
    },
  });

  const validateName = (value: string) => {
    if (!value.trim())
      return "Nombre es requerido"
    const res = CreateUserRequestBody.shape.name.safeParse(value);
    return res.success ? undefined : res.error.issues[0].message;
  }
  const validateFLastName = (value: string) => {
    if (!value.trim())
      return "Apellido es requerido"
    const res = CreateUserRequestBody.shape.father_last_name.safeParse(value);
    return res.success ? undefined : res.error.issues[0].message;
  }
  const validateMLastName = (value: string) => {
    if (!value.trim())
      return "Apellido es requerido"
    const res = CreateUserRequestBody.shape.mother_last_name.safeParse(value);
    return res.success ? undefined : res.error.issues[0].message;
  }
  const validateUserName = (value: string) => {
    if (!value.trim())
      return "Nombre de usuario es requerido"
    if (value.length < 3) 
      return "Nombre debe de tener al menos 3 caracteres"
    const res = CreateUserRequestBody.shape.username.safeParse(value);
    return res.success ? undefined : res.error.issues[0].message;
  }
  const validateEmail = (value: string) => {
    if (!value.trim())
      return "Email es requerido"
    const res = CreateUserRequestBody.shape.email.safeParse(value);
    return res.success ? undefined : res.error.issues[0].message;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>Crear Usuario</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear Usuario</DialogTitle>
          <DialogDescription>
            Inserta la información del nuevo usuario.
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
              onChange: ({ value }) => validateName(value),
              onSubmit: ({ value }) => validateName(value),
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
                  aria-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0 ? "true" : undefined}
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
              onChange: ({ value }) => validateFLastName(value),
              onSubmit: ({ value }) => validateFLastName(value),
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
                  aria-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0 ? "true" : undefined}
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
              onChange: ({ value }) => validateMLastName(value),
              onSubmit: ({ value }) => validateMLastName(value),
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
                  aria-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0 ? "true" : undefined}
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
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="juan.perez@example.com"
                  aria-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0 ? "true" : undefined}
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
              onChange: ({ value }) => validateUserName(value),
              onSubmit: ({ value }) => validateUserName(value),
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
                  aria-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0 ? "true" : undefined}
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
                const result = CreateUserRequestBody.shape.password.safeParse(value);
                if (!result.success)
                  return result.error.issues[0].message;
                if (value.length < 8)
                  return "La contraseña debe de tener al menos 8 caracteres";
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
                  placeholder="••••••••"
                  aria-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0 ? "true" : undefined}
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
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <form.Subscribe
              selector={(state) => [state.isSubmitting]}
            >
              {([isSubmitting]) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creando..." : "Crear Usuario"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
