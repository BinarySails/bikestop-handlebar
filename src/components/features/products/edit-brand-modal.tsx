import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import {
  useDeleteBrandRequest,
  useDisableBrandRequest,
  useGetBrandRequest,
  useUpdateBrandRequest,
} from "@/lib/api/api"
import { UpdateBrandRequestBody } from "@/lib/api/zods"

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
  AlertTriangleIcon,
  Loader2Icon,
  PencilIcon,
  PowerIcon,
  Trash2Icon,
} from "lucide-react"
import type { BrandId } from "@/lib/api/schemas"

interface EditBrandDialogProps {
  brandId: BrandId
}

export function EditBrandDialog({ brandId }: EditBrandDialogProps) {
  const [open, setOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const { data: brandData, isLoading } = useGetBrandRequest(brandId, {
    swr: { enabled: open },
  })
  const { trigger: updateBrand } = useUpdateBrandRequest(brandId)
  const { trigger: deleteBrand } = useDeleteBrandRequest(brandId)
  const { trigger: toggleBrand } = useDisableBrandRequest(brandId)

  const brand = brandData?.status === 200 ? brandData.data.brand : undefined
  const hasError = brandData !== undefined && brandData.status !== 200

  const form = useForm({
    defaultValues: {
      displayName: "",
      imageUrl: "",
    },
    onSubmit: async ({ value }) => {
      const result = await updateBrand({
        display_name: value.displayName,
        image_url: value.imageUrl,
      })

      const errorData =
        "data" in result
          ? (result as { data: { message?: string } }).data
          : null

      if (result.status === 200) {
        toast.success(`Marca "${value.displayName}" actualizada.`)
        setOpen(false)
      } else {
        toast.error(errorData?.message ?? "Error al actualizar la marca.")
      }
    },
  })

  useEffect(() => {
    if (brand) {
      form.setFieldValue("displayName", brand.display_name)
      form.setFieldValue("imageUrl", brand.image_url)
    }
  }, [brand, form])

  const handleDelete = async () => {
    const result = await deleteBrand()

    const errorData =
      "data" in result ? (result as { data: { message?: string } }).data : null

    if (result.status === 200) {
      toast.success("Marca eliminada.")
      setConfirmDeleteOpen(false)
      setOpen(false)
    } else {
      toast.error(errorData?.message ?? "Error al eliminar la marca.")
    }
  }

  const handleToggle = async () => {
    const result = await toggleBrand()

    const errorData =
      "data" in result ? (result as { data: { message?: string } }).data : null

    if (result.status === 200) {
      const nextStatus =
        brand?.status === "enable" ? "deshabilitada" : "habilitada"
      toast.success(`Marca ${nextStatus}.`)
    } else {
      toast.error(
        errorData?.message ?? "Error al cambiar el estado de la marca."
      )
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Editar marca"
        onClick={() => setOpen(true)}
      >
        <PencilIcon />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Marca</DialogTitle>
            <DialogDescription>
              Modifica la información de la marca.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2Icon className="animate-spin text-muted-foreground" />
            </div>
          ) : hasError ? (
            <div className="py-4 text-center text-sm text-red-500">
              Error al cargar la marca.
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
                name="displayName"
                validators={{
                  onChange: ({ value }) => {
                    const result =
                      UpdateBrandRequestBody.shape.display_name.safeParse(value)
                    if (!result.success) return result.error.issues[0].message
                    if (value.length < 3)
                      return "El nombre de visualización debe tener al menos 3 caracteres."
                    return undefined
                  },
                  onSubmit: ({ value }) => {
                    const result =
                      UpdateBrandRequestBody.shape.display_name.safeParse(value)
                    if (!result.success) return result.error.issues[0].message
                    if (value.length < 3)
                      return "El nombre de visualización debe tener al menos 3 caracteres."
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Nombre visible</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Specialized"
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
                name="imageUrl"
                validators={{
                  onChange: ({ value }) => {
                    const result =
                      UpdateBrandRequestBody.shape.image_url.safeParse(value)
                    return result.success
                      ? undefined
                      : result.error.issues[0].message
                  },
                }}
              >
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Link de la imagen</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="https://"
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
                <div className="flex flex-1 items-center gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDeleteOpen(true)}
                  >
                    <Trash2Icon />
                    <span className="sr-only">Eliminar marca</span>
                  </Button>

                  {brand?.status !== "archive" && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void handleToggle()}
                    >
                      <PowerIcon />
                      {brand?.status === "enable"
                        ? "Deshabilitar"
                        : "Habilitar"}
                    </Button>
                  )}
                </div>

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

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="text-destructive" />
              <DialogTitle>Confirmar eliminación</DialogTitle>
            </div>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta marca? Se archivará y no
              se podrá utilizar.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleDelete()}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
