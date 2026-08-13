import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { List, Package } from "lucide-react";
import { toast } from "sonner";

import { EntityDetailHeader } from "@/components/features/entity/entity-detail-header";
import { ProductInventoryTable } from "@/components/features/products/product-inventory-table";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useGetProductRequest,
  useGetCategoriesRequest,
  useListBrandsRequest,
  useListVariantsByProductRequest,
  useListWarehousesRequest,
  useUpdateProductRequest,
} from "@/lib/api/api";
import { useProductInventory } from "@/lib/api/use-product-inventory";
import type {
  Brand,
  Category,
  Product,
  ProductStatus,
  Variant,
  WarehouseResponse,
} from "@/lib/api/schemas";

const statusLabels: Record<ProductStatus, string> = {
  enable: "Activo",
  disable: "Inactivo",
  archive: "Archivado",
};

export const Route = createFileRoute("/_layout/products/$productId")({
  component: ProductDetailPage,
});

function ProductDetailSkeleton() {
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

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const {
    data: res,
    error,
    isLoading,
    mutate,
  } = useGetProductRequest(productId);

  const product: Product | null = res?.status === 200 ? res.data : null;

  if (isLoading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">
          Producto no encontrado o error al cargar.
        </p>
      </div>
    );
  }

  return <ProductDetailView product={product} mutateProduct={mutate} />;
}

function ProductDetailView({
  product,
  mutateProduct,
}: {
  product: Product;
  mutateProduct: () => Promise<unknown>;
}) {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const { trigger: updateProduct } = useUpdateProductRequest(productId);
  const { data: brandsRes, isLoading: brandsLoading } = useListBrandsRequest();
  const { data: categoriesRes, isLoading: categoriesLoading } =
    useGetCategoriesRequest();
  const { data: variantsRes, isLoading: variantsLoading } =
    useListVariantsByProductRequest(productId, {
      swr: {
        revalidateOnFocus: false,
      },
    });
  const { data: warehousesRes, isLoading: warehousesLoading } =
    useListWarehousesRequest(undefined, {
      swr: {
        revalidateOnFocus: false,
      },
    });

  const brands: Brand[] = brandsRes?.status === 200 ? brandsRes.data.data : [];
  const categories: Category[] =
    categoriesRes?.status === 200 ? categoriesRes.data.categories : [];
  const variants: Variant[] =
    variantsRes?.status === 200 ? variantsRes.data : [];
  const warehouses: WarehouseResponse[] =
    warehousesRes?.status === 200 ? warehousesRes.data : [];

  const {
    items: inventoryItems,
    isLoading: inventoryLoading,
    error: inventoryError,
    mutate: mutateInventory,
  } = useProductInventory(productId, variantsLoading ? undefined : variants);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const isArchived = product.status === "archive";

  const form = useForm({
    defaultValues: {
      display_name: product.display_name,
      brand_id: product.brand.id,
      category_id: product.category.id,
      description: product.description ?? "",
      status: product.status,
    },
    onSubmit: async ({ value }) => {
      const hasChanges =
        value.display_name !== product.display_name ||
        value.brand_id !== product.brand.id ||
        value.category_id !== product.category.id ||
        value.status !== product.status ||
        (value.description || null) !== (product.description ?? null);

      if (!hasChanges) {
        return;
      }

      try {
        const result = await updateProduct({
          display_name: value.display_name,
          brand_id: value.brand_id,
          category_id: value.category_id,
          description: value.description || null,
          status: value.status,
        });

        if (result?.status !== 200) {
          toast.error("Error al actualizar el producto.");
          return;
        }

        toast.success("Producto actualizado correctamente.");
        form.reset({
          display_name: value.display_name,
          brand_id: value.brand_id,
          category_id: value.category_id,
          description: value.description,
          status: value.status,
        });
        await mutateProduct();
      } catch {
        toast.error("Error al actualizar el producto.");
      }
    },
  });

  async function handleDelete() {
    setDeletePending(true);
    try {
      const result = await updateProduct({
        display_name: product.display_name,
        brand_id: product.brand.id,
        category_id: product.category.id,
        description: product.description ?? null,
        status: "archive",
      });

      if (result?.status !== 200) {
        toast.error("No se pudo archivar el producto.");
        return;
      }

      toast.success("Producto archivado correctamente.");
      setDeleteOpen(false);
      navigate({ to: "/products" });
    } catch {
      toast.error("No se pudo archivar el producto.");
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
            <EntityDetailHeader
              backTo="/products"
              backLabel="Volver a todos los productos"
              title="Producto"
              badge={
                <Badge variant="outline">{statusLabels[product.status]}</Badge>
              }
              extraActions={
                <Button
                  render={
                    <Link
                      to="/products/$productId/variants"
                      params={{ productId }}
                    />
                  }
                  variant="outline"
                >
                  <List className="size-4" />
                  <span>Ver variantes</span>
                </Button>
              }
              isDirty={isDirty}
              isSubmitting={isSubmitting}
              onSave={() => form.handleSubmit()}
              onDelete={() => setDeleteOpen(true)}
              showDelete={product.status !== "archive"}
            />
          )}
        </form.Subscribe>

        <Separator />

        <section id="information" className="scroll-mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Package className="size-4" />
                Información del producto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field name="display_name">
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Nombre del producto</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Bicicleta de montaña"
                      disabled={isArchived}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="brand_id">
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Marca</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value ?? "")}
                      disabled={isArchived || brandsLoading}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue
                          placeholder="Selecciona una marca"
                          render={() => (
                            <span>
                              {brands.find(
                                (brand) => brand.id === field.state.value
                              )?.display_name ?? "Selecciona una marca"}
                            </span>
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field name="category_id">
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Categoría</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value ?? "")}
                      disabled={isArchived || categoriesLoading}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue
                          placeholder="Selecciona una categoría"
                          render={() => (
                            <span>
                              {categories.find(
                                (category) => category.id === field.state.value
                              )?.display_name ?? "Selecciona una categoría"}
                            </span>
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field name="description">
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Descripción</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Descripción del producto"
                      disabled={isArchived}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="status">
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Estado</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as ProductStatus)
                      }
                      disabled={isArchived}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue
                          render={() => (
                            <span>
                              {statusLabels[field.state.value] ??
                                field.state.value}
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
                )}
              </form.Field>
            </CardContent>
          </Card>
        </section>
      </form>

      <section id="inventory" className="scroll-mt-4 space-y-6">
        <ProductInventoryTable
          productId={productId}
          warehouses={warehouses}
          items={inventoryItems}
          loading={inventoryLoading || warehousesLoading}
          error={inventoryError}
          onRetry={() => mutateInventory()}
          onAddSuccess={() => mutateInventory()}
        />
      </section>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas archivar &quot;{product.display_name}
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
              {deletePending ? "Archivando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
