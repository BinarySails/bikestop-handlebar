import { useEffect, useState } from "react"
import { useForm, useSelector } from "@tanstack/react-form"
import { toast } from "sonner"
import {
  useDeleteCategoryRequest,
  useGetCategoryRequest,
  useUpdateCategoryRequest,
} from "@/lib/api/api"
import { UpdateCategoryRequestBody } from "@/lib/api/zods"

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
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxEmpty,
} from "@/components/ui/combobox"
import {
  PencilIcon,
  Trash2Icon,
  Loader2Icon,
  AlertTriangleIcon,
} from "lucide-react"
import type { Category, CategoryId } from "@/lib/api/schemas"

const mockCategories: Category[] = [
  {
    id: "1",
    display_name: "Electronics",
    slug: "electronics",
    description: null,
    created_at: "",
    parent_id: null,
    status: "active",
  },
  {
    id: "2",
    display_name: "Clothing",
    slug: "clothing",
    description: null,
    created_at: "",
    parent_id: null,
    status: "active",
  },
  {
    id: "3",
    display_name: "Books",
    slug: "books",
    description: null,
    created_at: "",
    parent_id: null,
    status: "active",
  },
  {
    id: "4",
    display_name: "Smartphones",
    slug: "smartphones",
    description: null,
    created_at: "",
    parent_id: "1",
    status: "active",
  },
  {
    id: "5",
    display_name: "Laptops",
    slug: "laptops",
    description: null,
    created_at: "",
    parent_id: "1",
    status: "active",
  },
  {
    id: "6",
    display_name: "T-Shirts",
    slug: "t-shirts",
    description: null,
    created_at: "",
    parent_id: "2",
    status: "active",
  },
]

interface EditCategoryDialogProps {
  categoryId: CategoryId
}

export function EditCategoryDialog({ categoryId }: EditCategoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const { data: categoryData, isLoading } = useGetCategoryRequest(categoryId, {
    swr: { enabled: open },
  })
  const { trigger: updateCategory } = useUpdateCategoryRequest(categoryId)
  const { trigger: deleteCategory } = useDeleteCategoryRequest(categoryId)

  const category =
    categoryData?.status === 200 ? categoryData.data.category : undefined
  const hasError = categoryData !== undefined && categoryData.status !== 200

  const form = useForm({
    defaultValues: {
      displayName: "",
      description: "",
      parent: null as null | Category,
    },
    onSubmit: async ({ value }) => {
      const slug = value.displayName.toLowerCase().replace(/\s+/g, "-")

      const result = await updateCategory({
        display_name: value.displayName,
        slug,
        description: value.description || null,
        parent_id: value.parent?.id || null,
      })

      const errorData =
        "data" in result
          ? (result as { data: { message?: string } }).data
          : null

      if (result.status === 200) {
        toast.success(`Categoría "${value.displayName}" actualizada.`)
        setOpen(false)
      } else {
        toast.error(errorData?.message ?? "Error al actualizar la categoría.")
      }
    },
  })

  useEffect(() => {
    if (category) {
      const parent =
        mockCategories.find((c) => c.id === category.parent_id) ?? null
      form.setFieldValue("displayName", category.display_name)
      form.setFieldValue("description", category.description ?? "")
      form.setFieldValue("parent", parent)
    }
  }, [category, form])

  const displayName = useSelector(
    form.baseStore,
    (state) => state.values.displayName
  )
  const slug = displayName.toLowerCase().replace(/\s+/g, "-")

  const handleDelete = async () => {
    const result = await deleteCategory()

    const errorData =
      "data" in result ? (result as { data: { message?: string } }).data : null

    if (result.status === 200) {
      toast.success("Categoría eliminada.")
      setConfirmDeleteOpen(false)
      setOpen(false)
    } else {
      toast.error(errorData?.message ?? "Error al eliminar la categoría.")
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Editar categoría"
        onClick={() => setOpen(true)}
      >
        <PencilIcon />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Categoría</DialogTitle>
            <DialogDescription>
              Modifica la información de la categoría.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2Icon className="animate-spin text-muted-foreground" />
            </div>
          ) : hasError ? (
            <div className="py-4 text-center text-sm text-red-500">
              Error al cargar la categoría.
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
                      UpdateCategoryRequestBody.shape.display_name.safeParse(
                        value
                      )
                    if (!result.success) return result.error.issues[0].message
                    if (value.length < 3)
                      return "El nombre de visualización debe tener al menos 3 caracteres."
                    return undefined
                  },
                  onSubmit: ({ value }) => {
                    const result =
                      UpdateCategoryRequestBody.shape.display_name.safeParse(
                        value
                      )
                    if (!result.success) return result.error.issues[0].message
                    if (value.length < 3)
                      return "El nombre de visualización debe tener al menos 3 caracteres."
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Nombre de visualización</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Electrónica"
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

              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" value={slug} disabled />
              </div>

              <form.Field
                name="description"
                validators={{
                  onChange: ({ value }) => {
                    const result =
                      UpdateCategoryRequestBody.shape.description.safeParse(
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

              <form.Field name="parent">
                {(field) => (
                  <div className="grid gap-2">
                    <Label>Categoría padre</Label>
                    <Combobox
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                      items={mockCategories}
                      itemToStringValue={(item) => item.id}
                      itemToStringLabel={(item) => item.display_name}
                    >
                      <ComboboxInput
                        placeholder="Selecciona una categoría padre..."
                        showTrigger
                        showClear
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>
                          No se encontraron categorías
                        </ComboboxEmpty>

                        <ComboboxList>
                          {(item: Category) => (
                            <ComboboxItem key={item.id} value={item}>
                              {item.display_name}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>
                )}
              </form.Field>

              <DialogFooter>
                <div className="flex flex-1 items-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDeleteOpen(true)}
                  >
                    <Trash2Icon />
                    <span className="sr-only">Eliminar categoría</span>
                  </Button>
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
              ¿Estás seguro de que deseas eliminar esta categoría? Se marcará
              como inactiva y no se podrá utilizar.
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
