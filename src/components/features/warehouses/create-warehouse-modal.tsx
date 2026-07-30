import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { useCreateWarehouseRequest } from "@/lib/api/warehouses"
import { CreateWarehouseRequestBody } from "@/lib/api/warehouse-zods"

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
        postal_code: "",
        address: "",
      },
    },
    onSubmit: async ({ value }) => {
      const result = await trigger({
        status: "enable",
        code: value.code,
        name: value.name,
        description: value.description || null,
        address: value.address,
      })

      const errorData =
        "data" in result
          ? (result as { data: { message?: string } }).data
          : null

      if (result.status === 201) {
        toast.success(`Warehouse "${value.name}" created!`)
        form.reset()
        setOpen(false)
      } else {
        toast.error(errorData?.message ?? "Failed to create warehouse")
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
          <DialogTitle>Crear almacén</DialogTitle>
          <DialogDescription>
            Ingresa la información para el nuevo almacén.
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
                  CreateWarehouseRequestBody.shape.code.safeParse(value)
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
                  placeholder="WH-QRO-001"
                  aria-invalid={
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                      ? "true"
                      : undefined
                  }
                />
                {field.state.meta.errors[0] && (
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
                  placeholder="Main Warehouse"
                  aria-invalid={
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                      ? "true"
                      : undefined
                  }
                />
                {field.state.meta.errors[0] && (
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
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Descripción opcional"
                />
              </div>
            )}
          </form.Field>

          <div className="space-y-2">
            <Label>Dirección</Label>
            <div className="grid gap-4 rounded-lg border p-4">
              <form.Field
                name="address.country"
                validators={{
                  onChange: ({ value }) => {
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
                    {field.state.meta.errors[0] && (
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
                      placeholder="Querétaro"
                      aria-invalid={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                          ? "true"
                          : undefined
                      }
                    />
                    {field.state.meta.errors[0] && (
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
                      placeholder="Querétaro"
                      aria-invalid={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                          ? "true"
                          : undefined
                      }
                    />
                    {field.state.meta.errors[0] && (
                      <p className="text-sm text-red-500">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="address.postal_code"
                validators={{
                  onChange: ({ value }) => {
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
                    <Label htmlFor={field.name}>Código postal</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="76000"
                      aria-invalid={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                          ? "true"
                          : undefined
                      }
                    />
                    {field.state.meta.errors[0] && (
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
                    <Label htmlFor={field.name}>Calle y número</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Av. Constituyentes 1234"
                      aria-invalid={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                          ? "true"
                          : undefined
                      }
                    />
                    {field.state.meta.errors[0] && (
                      <p className="text-sm text-red-500">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
            </div>
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
