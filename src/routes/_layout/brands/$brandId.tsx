import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Tag } from "lucide-react";
import { toast } from "sonner";

import { ImageUploadField } from "@/components/features/brands/image-upload-field";
import { BrandDetailHeader } from "@/components/features/brands/brand-detail-header";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteBrandRequest,
  useGetBrandRequest,
  useUpdateBrandRequest,
} from "@/lib/api/api";
import type { Brand } from "@/lib/api/schemas";

const statusLabels: Record<string, string> = {
  enable: "Activa",
  disable: "Inactiva",
  archive: "Archivada",
};

export const Route = createFileRoute("/_layout/brands/$brandId")({
  component: BrandDetailPage,
});

function BrandDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 shrink-0 rounded-md" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[120px] w-full rounded-xl" />
        <Skeleton className="h-[140px] w-full rounded-xl" />
        <Skeleton className="h-[100px] w-full rounded-xl" />
      </div>
    </div>
  );
}

function BrandDetailPage() {
  const { brandId } = Route.useParams();
  const { data: res, error, isLoading, mutate } = useGetBrandRequest(brandId);

  const brand: Brand | null = res?.status === 200 ? res.data : null;

  if (isLoading) return <BrandDetailSkeleton />;

  if (error || !brand) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">
          Marca no encontrada o error al cargar.
        </p>
      </div>
    );
  }

  return <BrandDetailView brand={brand} mutateBrand={mutate} />;
}

function BrandDetailView({
  brand,
  mutateBrand,
}: {
  brand: Brand;
  mutateBrand: () => Promise<unknown>;
}) {
  const { brandId } = Route.useParams();
  const navigate = useNavigate();
  const { trigger: updateBrand } = useUpdateBrandRequest(brandId);
  const { trigger: deleteBrand } = useDeleteBrandRequest(brandId);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const isArchived = brand.status === "archive";

  const form = useForm({
    defaultValues: {
      display_name: brand.display_name,
      image_url: brand.image_url,
    },
    onSubmit: async ({ value }) => {
      if (
        value.display_name === brand.display_name &&
        value.image_url === brand.image_url
      ) {
        return;
      }

      try {
        const result = await updateBrand({
          display_name: value.display_name,
          image_url: value.image_url,
        });

        if (result?.status !== 200) {
          toast.error("Error al actualizar la marca.");
          return;
        }

        toast.success("Marca actualizada correctamente.");
        form.reset({
          display_name: value.display_name,
          image_url: value.image_url,
        });
        await mutateBrand();
      } catch {
        toast.error("Error al actualizar la marca.");
      }
    },
  });

  async function handleDelete() {
    setDeletePending(true);
    try {
      await deleteBrand();
      toast.success("Marca eliminada correctamente.");
      setDeleteOpen(false);
      navigate({ to: "/brands" as never });
    } catch {
      toast.error("No se pudo eliminar la marca.");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-8"
      >
        <form.Subscribe
          selector={(state) => [state.isSubmitting, state.isDirty]}
        >
          {([isSubmitting, isDirty]) => (
            <BrandDetailHeader
              brand={brand}
              isDirty={isDirty}
              isSubmitting={isSubmitting}
              onSave={() => form.handleSubmit()}
              onDeleteClick={() => setDeleteOpen(true)}
            />
          )}
        </form.Subscribe>

        <Separator />

        <section id="information" className="scroll-mt-4 space-y-6">
          <div className="flex items-start gap-6">
            <div className="shrink-0">
              <Avatar className="size-96 rounded-xl after:rounded-xl">
                <form.Field name="image_url">
                  {(field) =>
                    field.state.value ? (
                      <AvatarImage
                        src={field.state.value}
                        alt={brand.display_name}
                        className="rounded-xl object-cover"
                      />
                    ) : null
                  }
                </form.Field>
              </Avatar>
            </div>

            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Tag className="size-4" />
                  Información de la marca
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form.Field name="display_name">
                  {(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Nombre de la marca</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Specialized"
                        disabled={isArchived}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="image_url">
                  {(field) => (
                    <ImageUploadField
                      id={field.name}
                      label="Imagen de la marca"
                      value={field.state.value}
                      onChange={(url) => field.handleChange(url)}
                      disabled={isArchived}
                    />
                  )}
                </form.Field>

                <div className="grid gap-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select value={brand.status} disabled>
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue
                        render={() => (
                          <span>
                            {statusLabels[brand.status] ?? brand.status}
                          </span>
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enable">
                        {statusLabels.enable}
                      </SelectItem>
                      <SelectItem value="disable">
                        {statusLabels.disable}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </form>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar marca</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar &quot;{brand.display_name}
              &quot;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deletePending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deletePending}
            >
              {deletePending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
