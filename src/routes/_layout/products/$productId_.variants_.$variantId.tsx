import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Package, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { EntityDetailHeader } from "@/components/features/entity/entity-detail-header";
import { ImageUploadField } from "@/components/features/products/image-upload-field";
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
import { useGetVariantRequest, useUpdateVariantRequest } from "@/lib/api/api";
import type { Variant, VariantStatus } from "@/lib/api/schemas";
import { centsToPesosString, pesosToCents } from "@/lib/money";
import { UpdateVariantRequestBody } from "@/lib/api/zods";

const statusLabels: Record<VariantStatus, string> = {
  enable: "Activo",
  disable: "Inactivo",
  archive: "Archivado",
};

function validateUrl(value: string): string | undefined {
  if (!value.trim()) return "La URL de la imagen es obligatoria.";
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "Ingresa una URL válida.";
    }
  } catch {
    return "Ingresa una URL válida.";
  }
  return undefined;
}

function normalizePropertyInput(value: string): string {
  return value.trim().toLowerCase();
}

export const Route = createFileRoute(
  "/_layout/products/$productId_/variants_/$variantId"
)({
  component: VariantDetailPage,
});

function VariantDetailSkeleton() {
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
      </div>
    </div>
  );
}

function VariantDetailPage() {
  const { productId, variantId } = Route.useParams();
  const {
    data: res,
    error,
    isLoading,
    mutate,
  } = useGetVariantRequest(productId, variantId);

  const variant: Variant | null = res?.status === 200 ? res.data : null;

  if (isLoading) return <VariantDetailSkeleton />;

  if (error || !variant) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">
          Variante no encontrada o error al cargar.
        </p>
      </div>
    );
  }

  return <VariantDetailView variant={variant} mutateVariant={mutate} />;
}

function VariantDetailView({
  variant,
  mutateVariant,
}: {
  variant: Variant;
  mutateVariant: () => Promise<unknown>;
}) {
  const { productId, variantId } = Route.useParams();
  const navigate = useNavigate();
  const { trigger: updateVariant } = useUpdateVariantRequest(
    productId,
    variantId
  );

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const isArchived = variant.status === "archive";

  const form = useForm({
    defaultValues: {
      sku: variant.sku,
      display_name: variant.display_name,
      image_url: variant.image_url,
      status: variant.status,
      properties: variant.properties.map((property) => ({
        property_name: property.property_name,
        property_value: property.property_value,
        status: property.status,
      })),
      prices: variant.prices.map((price) => ({
        price_type: price.price_type,
        amount: centsToPesosString(price.amount),
        currency: price.currency,
        status: price.status,
      })),
    },
    onSubmit: async ({ value }) => {
      const propertyNames = new Set<string>();
      const normalizedProperties = value.properties.map((property) => {
        const property_name = normalizePropertyInput(property.property_name);
        const property_value = normalizePropertyInput(property.property_value);
        propertyNames.add(property_name);
        return {
          property_name,
          property_value,
          status: property.status,
        };
      });

      if (propertyNames.size !== normalizedProperties.length) {
        toast.error("No puede haber propiedades duplicadas.");
        return;
      }

      const normalizedPrices = value.prices.map((price) => ({
        price_type: price.price_type,
        amount: pesosToCents(Number(price.amount)),
        currency: price.currency.toUpperCase(),
        status: price.status,
      }));

      const payload = {
        sku: value.sku.trim().toUpperCase(),
        display_name: value.display_name.trim(),
        image_url: value.image_url.trim(),
        status: value.status,
        properties: normalizedProperties,
        prices: normalizedPrices,
      };

      const parseResult =
        await UpdateVariantRequestBody.safeParseAsync(payload);
      if (!parseResult.success) {
        toast.error(parseResult.error.issues[0]?.message ?? "Datos inválidos.");
        return;
      }

      try {
        const result = await updateVariant(parseResult.data);

        if (result?.status !== 200) {
          toast.error("Error al actualizar la variante.");
          return;
        }

        toast.success("Variante actualizada correctamente.");
        form.reset({
          sku: payload.sku,
          display_name: payload.display_name,
          image_url: payload.image_url,
          status: payload.status,
          properties: normalizedProperties,
          prices: value.prices.map((price) => ({
            price_type: price.price_type,
            amount: centsToPesosString(pesosToCents(Number(price.amount))),
            currency: price.currency.toUpperCase(),
            status: price.status,
          })),
        });
        await mutateVariant();
      } catch {
        toast.error("Error al actualizar la variante.");
      }
    },
  });

  async function handleDelete() {
    setDeletePending(true);
    try {
      const result = await updateVariant({
        sku: variant.sku,
        display_name: variant.display_name,
        image_url: variant.image_url,
        status: "archive",
        properties: variant.properties.map((property) => ({
          property_name: property.property_name,
          property_value: property.property_value,
          status: property.status,
        })),
        prices: variant.prices.map((price) => ({
          price_type: price.price_type,
          amount: price.amount,
          currency: price.currency,
          status: price.status,
        })),
      });

      if (result?.status !== 200) {
        toast.error("No se pudo archivar la variante.");
        return;
      }

      toast.success("Variante archivada correctamente.");
      setDeleteOpen(false);
      navigate({ to: "/products/$productId/variants", params: { productId } });
    } catch {
      toast.error("No se pudo archivar la variante.");
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
              backTo="/products/$productId/variants"
              backParams={{ productId }}
              backLabel="Volver a las variantes"
              title="Variante"
              badge={
                <Badge variant="outline">{statusLabels[variant.status]}</Badge>
              }
              isDirty={isDirty}
              isSubmitting={isSubmitting}
              onSave={() => form.handleSubmit()}
              onDelete={() => setDeleteOpen(true)}
              showDelete={variant.status !== "archive"}
            />
          )}
        </form.Subscribe>

        <Separator />

        <section id="information" className="scroll-mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Package className="size-4" />
                Información de la variante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="sku"
                  validators={{
                    onChange: ({ value }) =>
                      !value.trim() ? "El SKU es obligatorio." : undefined,
                    onSubmit: ({ value }) =>
                      !value.trim() ? "El SKU es obligatorio." : undefined,
                  }}
                >
                  {(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>SKU</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(e.target.value.toUpperCase())
                        }
                        placeholder="SKU-123"
                        disabled={isArchived}
                        aria-invalid={
                          field.state.meta.isTouched &&
                          field.state.meta.errors.length > 0
                        }
                      />
                      {field.state.meta.errors?.[0] && (
                        <p className="text-sm text-destructive">
                          {field.state.meta.errors[0]}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>

                <form.Field
                  name="display_name"
                  validators={{
                    onChange: ({ value }) =>
                      value.trim().length < 3
                        ? "El nombre debe tener al menos 3 caracteres."
                        : undefined,
                    onSubmit: ({ value }) =>
                      value.trim().length < 3
                        ? "El nombre debe tener al menos 3 caracteres."
                        : undefined,
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
                        placeholder="Bicicleta roja"
                        disabled={isArchived}
                        aria-invalid={
                          field.state.meta.isTouched &&
                          field.state.meta.errors.length > 0
                        }
                      />
                      {field.state.meta.errors?.[0] && (
                        <p className="text-sm text-destructive">
                          {field.state.meta.errors[0]}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>
              </div>

              <form.Field
                name="image_url"
                validators={{
                  onChange: ({ value }) => validateUrl(value),
                  onSubmit: ({ value }) => validateUrl(value),
                }}
              >
                {(field) => (
                  <ImageUploadField
                    id={field.name}
                    label="Imagen"
                    value={field.state.value}
                    onChange={(url) => field.handleChange(url)}
                    disabled={isArchived}
                  />
                )}
              </form.Field>

              <form.Field name="status">
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Estado</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as VariantStatus)
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

        <section id="properties" className="scroll-mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Propiedades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field name="properties">
                {(field) => (
                  <div className="grid gap-4">
                    {field.state.value.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No hay propiedades.
                      </p>
                    )}

                    {field.state.value.map((_, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <form.Field name={`properties[${index}].property_name`}>
                          {(subField) => (
                            <div className="grid flex-1 gap-1.5">
                              <Label
                                htmlFor={subField.name}
                                className="text-xs"
                              >
                                Nombre
                              </Label>
                              <Input
                                id={subField.name}
                                value={subField.state.value}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value)
                                }
                                placeholder="color"
                                disabled={isArchived}
                              />
                            </div>
                          )}
                        </form.Field>

                        <form.Field
                          name={`properties[${index}].property_value`}
                        >
                          {(subField) => (
                            <div className="grid flex-1 gap-1.5">
                              <Label
                                htmlFor={subField.name}
                                className="text-xs"
                              >
                                Valor
                              </Label>
                              <Input
                                id={subField.name}
                                value={subField.state.value}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value)
                                }
                                placeholder="rojo"
                                disabled={isArchived}
                              />
                            </div>
                          )}
                        </form.Field>

                        <form.Field name={`properties[${index}].status`}>
                          {(subField) => (
                            <div className="grid flex-1 gap-1.5">
                              <Label
                                htmlFor={subField.name}
                                className="text-xs"
                              >
                                Estado
                              </Label>
                              <Select
                                value={subField.state.value}
                                onValueChange={(value) =>
                                  subField.handleChange(value as VariantStatus)
                                }
                                disabled={isArchived}
                              >
                                <SelectTrigger id={subField.name}>
                                  <SelectValue
                                    render={() => (
                                      <span>
                                        {statusLabels[subField.state.value] ??
                                          subField.state.value}
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

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-5 size-8 text-destructive"
                          onClick={() => field.removeValue(index)}
                          disabled={isArchived}
                          aria-label="Eliminar propiedad"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={() =>
                        field.pushValue({
                          property_name: "",
                          property_value: "",
                          status: "enable",
                        })
                      }
                      disabled={isArchived}
                    >
                      <Plus className="size-4" />
                      Agregar propiedad
                    </Button>
                  </div>
                )}
              </form.Field>
            </CardContent>
          </Card>
        </section>

        <section id="prices" className="scroll-mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Precios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field name="prices">
                {(field) => (
                  <div className="grid gap-4">
                    {field.state.value.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No hay precios.
                      </p>
                    )}

                    {field.state.value.map((_, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <form.Field name={`prices[${index}].amount`}>
                          {(subField) => (
                            <div className="grid flex-1 gap-1.5">
                              <Label
                                htmlFor={subField.name}
                                className="text-xs"
                              >
                                Monto (MXN)
                              </Label>
                              <Input
                                id={subField.name}
                                type="number"
                                step="0.01"
                                min="0"
                                value={subField.state.value}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value)
                                }
                                placeholder="199.99"
                                disabled={isArchived}
                                className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              />
                            </div>
                          )}
                        </form.Field>

                        <div className="grid flex-1 gap-1.5">
                          <Label className="text-xs">Tipo</Label>
                          <Input
                            value={field.state.value[index].price_type}
                            disabled
                          />
                        </div>

                        <div className="grid flex-1 gap-1.5">
                          <Label className="text-xs">Moneda</Label>
                          <Input
                            value={field.state.value[index].currency}
                            disabled
                          />
                        </div>

                        <form.Field name={`prices[${index}].status`}>
                          {(subField) => (
                            <div className="grid flex-1 gap-1.5">
                              <Label
                                htmlFor={subField.name}
                                className="text-xs"
                              >
                                Estado
                              </Label>
                              <Select
                                value={subField.state.value}
                                onValueChange={(value) =>
                                  subField.handleChange(value as VariantStatus)
                                }
                                disabled={isArchived}
                              >
                                <SelectTrigger id={subField.name}>
                                  <SelectValue
                                    render={() => (
                                      <span>
                                        {statusLabels[subField.state.value] ??
                                          subField.state.value}
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

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-5 size-8 text-destructive"
                          onClick={() => field.removeValue(index)}
                          disabled={isArchived}
                          aria-label="Eliminar precio"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={() =>
                        field.pushValue({
                          price_type: "regular",
                          amount: "",
                          currency: "MXN",
                          status: "enable",
                        })
                      }
                      disabled={isArchived}
                    >
                      <Plus className="size-4" />
                      Agregar precio
                    </Button>
                  </div>
                )}
              </form.Field>
            </CardContent>
          </Card>
        </section>
      </form>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar variante</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas archivar &quot;{variant.display_name}
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
