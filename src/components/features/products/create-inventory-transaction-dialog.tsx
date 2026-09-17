import { useForm, type ReactFormExtendedApi } from "@tanstack/react-form";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ProductCombobox } from "@/components/features/sales/product-combobox";
import { VariantCombobox } from "@/components/features/sales/variant-combobox";
import { WarehouseCombobox } from "@/components/features/warehouses/warehouse-combobox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateInventoryTransactionRequest,
  useListVariantsRequest,
} from "@/lib/api/api";
import type { Product, WarehouseResponse } from "@/lib/api/schemas";

type CreateInventoryTransactionDialogProps = {
  warehouses: WarehouseResponse[];
  products?: Product[];
  preselectedProductId?: string;
  preselectedVariantId?: string;
  onSuccess?: () => Promise<unknown> | void;
};

function validateQuantity(value: string): string | undefined {
  if (!value.trim()) return "La cantidad es obligatoria.";
  const number = Number(value);
  if (Number.isNaN(number) || !Number.isInteger(number) || number <= 0) {
    return "La cantidad debe ser un número entero mayor a 0.";
  }
  return undefined;
}

type TransactionFormData = {
  productId: string;
  variantId: string;
  warehouseId: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  quantity: string;
  transactionType:
    | "correction_addition"
    | "correction_substraction"
    | "available"
    | "in_transit";
};

type TransactionForm = ReactFormExtendedApi<
  TransactionFormData,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;

function VariantField({
  form,
  effectiveProductId,
  show,
}: {
  form: TransactionForm;
  effectiveProductId: string;
  show: boolean;
}) {
  const { data: variantsResponse } = useListVariantsRequest(
    effectiveProductId,
    undefined,
    {
      swr: {
        revalidateOnFocus: false,
        enabled: !!effectiveProductId,
      },
    }
  );

  const variants =
    variantsResponse?.status === 200 ? variantsResponse.data : [];

  if (!show) return null;

  return (
    <form.Field
      name="variantId"
      validators={{
        onSubmit: ({ value }) => {
          if (!value) return "La variante es obligatoria.";
          return undefined;
        },
      }}
    >
      {(field) => (
        <div className="grid gap-2">
          <Label htmlFor={field.name}>Variante</Label>
          <VariantCombobox
            id={field.name}
            productId={effectiveProductId ?? null}
            value={
              variants.find((variant) => variant.id === field.state.value) ??
              null
            }
            onChange={(variant) => {
              field.handleChange(variant?.id ?? "");
            }}
            disabled={!effectiveProductId}
          />
          {field.state.meta.errors?.[0] && (
            <p className="text-sm text-destructive">
              {field.state.meta.errors[0]}
            </p>
          )}
        </div>
      )}
    </form.Field>
  );
}

export function CreateInventoryTransactionDialog({
  warehouses,
  products,
  preselectedProductId,
  preselectedVariantId,
  onSuccess,
}: CreateInventoryTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const { trigger, isMutating } = useCreateInventoryTransactionRequest();

  const showProductSelect =
    !preselectedProductId &&
    !preselectedVariantId &&
    products &&
    products.length > 0;
  const showVariantSelect = !preselectedVariantId;

  const form = useForm({
    defaultValues: {
      productId: preselectedProductId ?? "",
      variantId: preselectedVariantId ?? "",
      warehouseId: "",
      sourceWarehouseId: "",
      destinationWarehouseId: "",
      quantity: "",
      transactionType: "correction_addition" as
        | "correction_addition"
        | "correction_substraction"
        | "available"
        | "in_transit",
    },
    onSubmit: async ({ value }) => {
      if (warehouses.length === 0) {
        toast.error("No hay almacenes disponibles.");
        return;
      }

      const quantityError = validateQuantity(value.quantity);
      if (quantityError) {
        toast.error(quantityError);
        return;
      }

      const variantId = preselectedVariantId || value.variantId;
      if (!variantId) {
        toast.error("Selecciona una variante.");
        return;
      }

      const quantity = Number(value.quantity);

      if (value.transactionType === "in_transit") {
        const sourceWarehouse = warehouses.find(
          (w) => w.id === value.sourceWarehouseId
        );
        const destinationWarehouse = warehouses.find(
          (w) => w.id === value.destinationWarehouseId
        );

        if (!sourceWarehouse) {
          toast.error("Selecciona un almacén de origen válido.");
          return;
        }
        if (!destinationWarehouse) {
          toast.error("Selecciona un almacén de destino válido.");
          return;
        }
        if (sourceWarehouse.id === destinationWarehouse.id) {
          toast.error("El almacén de destino debe ser diferente al de origen.");
          return;
        }

        const result = await trigger({
          variant_id: variantId,
          warehouse_id: sourceWarehouse.id,
          quantity,
          transaction_type: value.transactionType,
          source_type: "warehouse",
          source_id: sourceWarehouse.id,
          destination_type: "warehouse",
          destination_id: destinationWarehouse.id,
        });

        if (result.status === 201) {
          toast.success("Transferencia entre almacenes registrada.");
          form.reset();
          setOpen(false);
          await onSuccess?.();
        } else {
          const errorMessage =
            "data" in result &&
            typeof result.data === "object" &&
            result.data !== null &&
            "message" in result.data
              ? (result.data as { message?: string }).message
              : undefined;
          toast.error(errorMessage ?? "Error al crear transacción.");
        }
      } else {
        const selectedWarehouse = warehouses.find(
          (w) => w.id === value.warehouseId
        );
        if (!selectedWarehouse) {
          toast.error("Selecciona un almacén válido.");
          return;
        }

        const result = await trigger({
          variant_id: variantId,
          warehouse_id: selectedWarehouse.id,
          quantity,
          transaction_type: value.transactionType,
        });

        if (result.status === 201) {
          const successMessage =
            value.transactionType === "correction_addition"
              ? "Corrección aplicada: stock agregado."
              : value.transactionType === "correction_substraction"
                ? "Corrección aplicada: stock restado."
                : "Inventario nuevo ingresado.";
          toast.success(successMessage);
          form.reset();
          setOpen(false);
          await onSuccess?.();
        } else {
          const errorMessage =
            "data" in result &&
            typeof result.data === "object" &&
            result.data !== null &&
            "message" in result.data
              ? (result.data as { message?: string }).message
              : undefined;
          toast.error(errorMessage ?? "Error al crear transacción.");
        }
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="size-4" />
            Crear transacción
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear transacción</DialogTitle>
          <DialogDescription>
            {preselectedVariantId
              ? "Selecciona el almacén y cantidad a registrar."
              : "Selecciona el producto, variante, almacén y cantidad a registrar."}
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
          {showProductSelect && (
            <form.Field
              name="productId"
              validators={{
                onSubmit: ({ value }) => {
                  if (!value) return "El producto es obligatorio.";
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Producto</Label>
                  <ProductCombobox
                    id={field.name}
                    value={
                      products?.find(
                        (product) => product.id === field.state.value
                      ) ?? null
                    }
                    onChange={(product) => {
                      field.handleChange(product?.id ?? "");
                      form.setFieldValue("variantId", "");
                    }}
                  />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          )}

          {showVariantSelect && (
            <form.Subscribe selector={(state) => state.values.productId}>
              {(selectedProductId) => {
                const effectiveProductId =
                  preselectedProductId ?? selectedProductId;
                return (
                  <VariantField
                    form={form}
                    effectiveProductId={effectiveProductId}
                    show
                  />
                );
              }}
            </form.Subscribe>
          )}

          <form.Field name="transactionType">
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Tipo de transacción</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(val) => {
                    field.handleChange(
                      val as
                        | "correction_addition"
                        | "correction_substraction"
                        | "available"
                        | "in_transit"
                    );
                    if (val === "in_transit") {
                      form.setFieldValue("warehouseId", "");
                    } else {
                      form.setFieldValue("sourceWarehouseId", "");
                      form.setFieldValue("destinationWarehouseId", "");
                    }
                  }}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue>
                      {field.state.value === "correction_addition"
                        ? "Corrección: agregar stock"
                        : field.state.value === "correction_substraction"
                          ? "Corrección: restar stock"
                          : field.state.value === "in_transit"
                            ? "Transacción entre almacenes"
                            : "Ingreso de inventario nuevo"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="correction_addition">
                      Corrección: agregar stock
                    </SelectItem>
                    <SelectItem value="correction_substraction">
                      Corrección: restar stock
                    </SelectItem>
                    <SelectItem value="available">
                      Ingreso de inventario nuevo
                    </SelectItem>
                    <SelectItem value="in_transit">
                      Transacción entre almacenes
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => state.values.transactionType}>
            {(transactionType) =>
              transactionType === "in_transit" ? (
                <>
                  <form.Field
                    name="sourceWarehouseId"
                    validators={{
                      onSubmit: ({ value }) => {
                        if (!value)
                          return "El almacén de origen es obligatorio.";
                        return undefined;
                      },
                    }}
                  >
                    {(field) => (
                      <div className="grid gap-2">
                        <Label htmlFor={field.name}>Almacén de origen</Label>
                        <WarehouseCombobox
                          id={field.name}
                          value={
                            warehouses.find(
                              (warehouse) => warehouse.id === field.state.value
                            ) ?? null
                          }
                          onChange={(warehouse) => {
                            field.handleChange(warehouse?.id ?? "");
                            const currentDest =
                              form.state.values.destinationWarehouseId;
                            if (warehouse && currentDest === warehouse.id) {
                              form.setFieldValue("destinationWarehouseId", "");
                            }
                          }}
                        />
                        {field.state.meta.errors?.[0] && (
                          <p className="text-sm text-destructive">
                            {field.state.meta.errors[0]}
                          </p>
                        )}
                      </div>
                    )}
                  </form.Field>

                  <form.Subscribe
                    selector={(state) => state.values.sourceWarehouseId}
                  >
                    {(sourceWarehouseId) => (
                      <form.Field
                        name="destinationWarehouseId"
                        validators={{
                          onSubmit: ({ value }) => {
                            if (!value)
                              return "El almacén de destino es obligatorio.";
                            return undefined;
                          },
                        }}
                      >
                        {(field) => (
                          <div className="grid gap-2">
                            <Label htmlFor={field.name}>
                              Almacén de destino
                            </Label>
                            <WarehouseCombobox
                              id={field.name}
                              excludeId={sourceWarehouseId || undefined}
                              value={
                                warehouses.find(
                                  (warehouse) =>
                                    warehouse.id === field.state.value
                                ) ?? null
                              }
                              onChange={(warehouse) => {
                                field.handleChange(warehouse?.id ?? "");
                              }}
                            />
                            {field.state.meta.errors?.[0] && (
                              <p className="text-sm text-destructive">
                                {field.state.meta.errors[0]}
                              </p>
                            )}
                          </div>
                        )}
                      </form.Field>
                    )}
                  </form.Subscribe>
                </>
              ) : (
                <form.Field
                  name="warehouseId"
                  validators={{
                    onSubmit: ({ value }) => {
                      if (!value) return "El almacén es obligatorio.";
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Almacén</Label>
                      <WarehouseCombobox
                        id={field.name}
                        value={
                          warehouses.find(
                            (warehouse) => warehouse.id === field.state.value
                          ) ?? null
                        }
                        onChange={(warehouse) => {
                          field.handleChange(warehouse?.id ?? "");
                        }}
                      />
                      {field.state.meta.errors?.[0] && (
                        <p className="text-sm text-destructive">
                          {field.state.meta.errors[0]}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>
              )
            }
          </form.Subscribe>

          <form.Field
            name="quantity"
            validators={{
              onChange: ({ value }) => validateQuantity(value),
              onSubmit: ({ value }) => validateQuantity(value),
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Cantidad</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  min={1}
                  step={1}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="10"
                  aria-invalid={
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                  }
                  className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-destructive">
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
              disabled={isMutating}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isMutating}>
              {isMutating ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
