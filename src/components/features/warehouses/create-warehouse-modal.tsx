import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { useCreateWarehouseRequest } from "@/lib/api/api"
import { CreateWarehouseRequestBody } from "@/lib/api/zods"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function CreateWarehouseDialog() {
  const [open, setOpen] = useState(false)
  const { trigger } = useCreateWarehouseRequest()

  const form = useForm({
    defaultValues: {
      code: "",
      name: "",
      description: "",
      address: {
        country: "",
        state: "",
        city: "",
        postalCode: "",
        address: "",
      },
    },
    onSubmit: async ({ value }) => {
      const result = await trigger({
        code: value.code || null,
        name: value.name,
        description: value.description || null,
        address: {
          country: value.address.country,
          state: value.address.state,
          city: value.address.city,
          postal_code: value.address.postalCode,
          address: value.address.address,
        },
      })

      const errorData =
        "data" in result
          ? (result as { data: { message?: string } }).data
          : null

      if (result.status === 201) {
        toast.success(`Almacén "${value.name}" creado.`)
        form.reset()
        setOpen(false)
      } else {
        toast.error(errorData?.message ?? "Error al crear el almacén.")
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>Crear Almacén</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear Almacén</DialogTitle>
          <DialogDescription>
            Ingresa la información del nuevo almacén.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.Field
            name="code"
            validators={{
              onChange: ({ value }) => {
                const result =
                  CreateWarehouseRequestBody.shape.code.safeParse(value || null)
                return result.success
                  ? undefined
                  : result.error.issues[0].message
              },
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Código</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="ALM-01"
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
            name="name"
            validators={{
              onChange: ({ value }) => {
                if (!value.trim()) return "El nombre es requerido"
                const result =
                  CreateWarehouseRequestBody.shape.name.safeParse(value)
                return result.success
                  ? undefined
                  : result.error.issues[0].message
              },
              onSubmit: ({ value }) => {
                if (!value.trim()) return "El nombre es requerido"
                const result =
                  CreateWarehouseRequestBody.shape.name.safeParse(value)
                return result.success
                  ? undefined
                  : result.error.issues[0].message
              },
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
                  placeholder="Almacén Principal"
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
            name="description"
            validators={{
              onChange: ({ value }) => {
                const result =
                  CreateWarehouseRequestBody.shape.description.safeParse(
                    value || null
                  )
                return result.success
                  ? undefined
                  : result.error.issues[0].message
              },
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Descripción</Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Descripción opcional"
                />
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-red-500">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <div className="space-y-4 rounded-lg border p-4">
            <p className="text-sm font-medium">Dirección</p>

            <form.Field
              name="address.country"
              validators={{
                onChange: ({ value }) => {
                  if (!value.trim()) return "El país es requerido"
                  const result =
                    CreateWarehouseRequestBody.shape.address.shape.country.safeParse(
                      value
                    )
                  return result.success
                    ? undefined
                    : result.error.issues[0].message
                },
                onSubmit: ({ value }) => {
                  if (!value.trim()) return "El país es requerido"
                  const result =
                    CreateWarehouseRequestBody.shape.address.shape.country.safeParse(
                      value
                    )
                  return result.success
                    ? undefined
                    : result.error.issues[0].message
                },
              }}
            >
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>País</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="México"
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
              name="address.state"
              validators={{
                onChange: ({ value }) => {
                  if (!value.trim()) return "El estado es requerido"
                  const result =
                    CreateWarehouseRequestBody.shape.address.shape.state.safeParse(
                      value
                    )
                  return result.success
                    ? undefined
                    : result.error.issues[0].message
                },
                onSubmit: ({ value }) => {
                  if (!value.trim()) return "El estado es requerido"
                  const result =
                    CreateWarehouseRequestBody.shape.address.shape.state.safeParse(
                      value
                    )
                  return result.success
                    ? undefined
                    : result.error.issues[0].message
                },
              }}
            >
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Estado</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Jalisco"
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
              name="address.city"
              validators={{
                onChange: ({ value }) => {
                  if (!value.trim()) return "La ciudad es requerida"
                  const result =
                    CreateWarehouseRequestBody.shape.address.shape.city.safeParse(
                      value
                    )
                  return result.success
                    ? undefined
                    : result.error.issues[0].message
                },
                onSubmit: ({ value }) => {
                  if (!value.trim()) return "La ciudad es requerida"
                  const result =
                    CreateWarehouseRequestBody.shape.address.shape.city.safeParse(
                      value
                    )
                  return result.success
                    ? undefined
                    : result.error.issues[0].message
                },
              }}
            >
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Ciudad</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Guadalajara"
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
              name="address.postalCode"
              validators={{
                onChange: ({ value }) => {
                  if (!value.trim()) return "El código postal es requerido"
                  const result =
                    CreateWarehouseRequestBody.shape.address.shape.postal_code.safeParse(
                      value
                    )
                  return result.success
                    ? undefined
                    : result.error.issues[0].message
                },
                onSubmit: ({ value }) => {
                  if (!value.trim()) return "El código postal es requerido"
                  const result =
                    CreateWarehouseRequestBody.shape.address.shape.postal_code.safeParse(
                      value
                    )
                  return result.success
                    ? undefined
                    : result.error.issues[0].message
                },
              }}
            >
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Código Postal</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="44100"
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
              name="address.address"
              validators={{
                onChange: ({ value }) => {
                  if (!value.trim()) return "La dirección es requerida"
                  const result =
                    CreateWarehouseRequestBody.shape.address.shape.address.safeParse(
                      value
                    )
                  return result.success
                    ? undefined
                    : result.error.issues[0].message
                },
                onSubmit: ({ value }) => {
                  if (!value.trim()) return "La dirección es requerida"
                  const result =
                    CreateWarehouseRequestBody.shape.address.shape.address.safeParse(
                      value
                    )
                  return result.success
                    ? undefined
                    : result.error.issues[0].message
                },
              }}
            >
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Calle y Número</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Av. Vallarta 1234"
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
                  {isSubmitting ? "Creando..." : "Crear Almacén"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
