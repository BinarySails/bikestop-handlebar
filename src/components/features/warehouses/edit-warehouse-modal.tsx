import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { Loader2Icon, PencilIcon } from "lucide-react"
import {
  useGetWarehouseRequest,
  useUpdateWarehouseRequest,
  useUpdateWarehouseStatusRequest,
} from "@/lib/api/api"
import {
  UpdateWarehouseRequestBody,
  UpdateWarehouseStatusRequestBody,
} from "@/lib/api/zods"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { WarehouseId, WarehouseStatus } from "@/lib/api/schemas"

interface EditWarehouseDialogProps {
  warehouseId: WarehouseId
}

export function EditWarehouseDialog({
  warehouseId,
}: EditWarehouseDialogProps) {
  const [open, setOpen] = useState(false)

  const { data: warehouseData, isLoading } = useGetWarehouseRequest(
    warehouseId,
    {
      swr: { enabled: open },
    }
  )
  const { trigger: updateWarehouse } = useUpdateWarehouseRequest(warehouseId)
  const { trigger: updateWarehouseStatus } =
    useUpdateWarehouseStatusRequest(warehouseId)

  const warehouse =
    warehouseData?.status === 200 ? warehouseData.data : undefined
  const hasError = warehouseData !== undefined && warehouseData.status !== 200

  const form = useForm({
    defaultValues: {
      code: "",
      name: "",
      description: "",
      status: "active" as WarehouseStatus,
      address: {
        country: "",
        state: "",
        city: "",
        postalCode: "",
        address: "",
      },
    },
    onSubmit: async ({ value }) => {
      const detailsResult = await updateWarehouse({
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

      const detailsErrorData =
        "data" in detailsResult
          ? (detailsResult as { data: { message?: string } }).data
          : null

      if (detailsResult.status !== 200) {
        toast.error(
          detailsErrorData?.message ?? "Error al actualizar el almacén."
        )
        return
      }

      const statusResult = await updateWarehouseStatus({
        status: value.status,
      })

      const statusErrorData =
        "data" in statusResult
          ? (statusResult as { data: { message?: string } }).data
          : null

      if (statusResult.status === 200) {
        toast.success(`Almacén "${value.name}" actualizado.`)
        setOpen(false)
      } else {
        toast.error(
          statusErrorData?.message ??
            "Almacén actualizado, pero error al cambiar el estado."
        )
        setOpen(false)
      }
    },
  })

  useEffect(() => {
    if (warehouse) {
      form.setFieldValue("code", warehouse.code ?? "")
      form.setFieldValue("name", warehouse.name)
      form.setFieldValue("description", warehouse.description ?? "")
      form.setFieldValue("status", warehouse.status)
      form.setFieldValue("address.country", warehouse.address.country)
      form.setFieldValue("address.state", warehouse.address.state)
      form.setFieldValue("address.city", warehouse.address.city)
      form.setFieldValue("address.postalCode", warehouse.address.postal_code)
      form.setFieldValue("address.address", warehouse.address.address)
    }
  }, [warehouse, form])

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Editar almacén"
        onClick={() => setOpen(true)}
      >
        <PencilIcon />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Almacén</DialogTitle>
            <DialogDescription>
              Modifica la información del almacén.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2Icon className="animate-spin text-muted-foreground" />
            </div>
          ) : hasError ? (
            <div className="py-4 text-center text-sm text-red-500">
              Error al cargar el almacén.
            </div>
          ) : (
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
                      UpdateWarehouseRequestBody.shape.code.safeParse(
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
                      UpdateWarehouseRequestBody.shape.name.safeParse(value)
                    return result.success
                      ? undefined
                      : result.error.issues[0].message
                  },
                  onSubmit: ({ value }) => {
                    if (!value.trim()) return "El nombre es requerido"
                    const result =
                      UpdateWarehouseRequestBody.shape.name.safeParse(value)
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
                      UpdateWarehouseRequestBody.shape.description.safeParse(
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

              <form.Field
                name="status"
                validators={{
                  onChange: ({ value }) => {
                    const result =
                      UpdateWarehouseStatusRequestBody.shape.status.safeParse(
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
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as WarehouseStatus)
                      }
                    >
                      <SelectTrigger
                        id={field.name}
                        aria-invalid={
                          field.state.meta.isTouched &&
                          field.state.meta.errors.length > 0
                            ? "true"
                            : undefined
                        }
                      >
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
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
                        UpdateWarehouseRequestBody.shape.address.shape.country.safeParse(
                          value
                        )
                      return result.success
                        ? undefined
                        : result.error.issues[0].message
                    },
                    onSubmit: ({ value }) => {
                      if (!value.trim()) return "El país es requerido"
                      const result =
                        UpdateWarehouseRequestBody.shape.address.shape.country.safeParse(
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
                        UpdateWarehouseRequestBody.shape.address.shape.state.safeParse(
                          value
                        )
                      return result.success
                        ? undefined
                        : result.error.issues[0].message
                    },
                    onSubmit: ({ value }) => {
                      if (!value.trim()) return "El estado es requerido"
                      const result =
                        UpdateWarehouseRequestBody.shape.address.shape.state.safeParse(
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
                        UpdateWarehouseRequestBody.shape.address.shape.city.safeParse(
                          value
                        )
                      return result.success
                        ? undefined
                        : result.error.issues[0].message
                    },
                    onSubmit: ({ value }) => {
                      if (!value.trim()) return "La ciudad es requerida"
                      const result =
                        UpdateWarehouseRequestBody.shape.address.shape.city.safeParse(
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
                        UpdateWarehouseRequestBody.shape.address.shape.postal_code.safeParse(
                          value
                        )
                      return result.success
                        ? undefined
                        : result.error.issues[0].message
                    },
                    onSubmit: ({ value }) => {
                      if (!value.trim()) return "El código postal es requerido"
                      const result =
                        UpdateWarehouseRequestBody.shape.address.shape.postal_code.safeParse(
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
                        UpdateWarehouseRequestBody.shape.address.shape.address.safeParse(
                          value
                        )
                      return result.success
                        ? undefined
                        : result.error.issues[0].message
                    },
                    onSubmit: ({ value }) => {
                      if (!value.trim()) return "La dirección es requerida"
                      const result =
                        UpdateWarehouseRequestBody.shape.address.shape.address.safeParse(
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
                      {isSubmitting ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  )}
                </form.Subscribe>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
