import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { WarehouseIcon } from "lucide-react";
import { toast } from "sonner";

import { WarehouseDetailHeader } from "@/components/features/warehouses/warehouse-detail-header";
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
  useGetWarehouseRequest,
  useListStatesRequest,
  useUpdateWarehouseRequest,
  useUpdateWarehouseStatusRequest,
} from "@/lib/api/api";
import type { WarehouseResponse } from "@/lib/api/schemas";
import { UpdateWarehouseRequestBody } from "@/lib/api/zods";

const DEFAULT_COUNTRY = "México";

const statusLabels: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
};

export const Route = createFileRoute("/_layout/warehouses/$warehouseId")({
  component: WarehouseDetailPage,
});

function WarehouseDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 shrink-0 rounded-md" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[260px] w-full rounded-xl" />
      </div>
    </div>
  );
}

function WarehouseDetailPage() {
  const { warehouseId } = Route.useParams();
  const {
    data: res,
    error,
    isLoading,
    mutate,
  } = useGetWarehouseRequest(warehouseId);

  const warehouse: WarehouseResponse | null =
    res?.status === 200 ? res.data : null;

  if (isLoading) return <WarehouseDetailSkeleton />;

  if (error || !warehouse) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">
          Almacén no encontrado o error al cargar.
        </p>
      </div>
    );
  }

  return <WarehouseDetailView warehouse={warehouse} mutateWarehouse={mutate} />;
}

function WarehouseDetailView({
  warehouse,
  mutateWarehouse,
}: {
  warehouse: WarehouseResponse;
  mutateWarehouse: () => Promise<unknown>;
}) {
  const { warehouseId } = Route.useParams();
  const navigate = useNavigate();
  const { trigger: updateWarehouse } = useUpdateWarehouseRequest(warehouseId);
  const { trigger: updateWarehouseStatus } =
    useUpdateWarehouseStatusRequest(warehouseId);
  const { data: statesResponse, isLoading: isLoadingStates } =
    useListStatesRequest();

  const states =
    statesResponse?.status === 200 ? (statesResponse.data ?? []) : [];

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const isInactive = warehouse.status === "inactive";

  const form = useForm({
    defaultValues: {
      code: warehouse.code ?? "",
      name: warehouse.name,
      description: warehouse.description ?? "",
      address: {
        country: warehouse.address.country,
        state: warehouse.address.state,
        city: warehouse.address.city,
        postalCode: warehouse.address.postal_code,
        address: warehouse.address.address,
      },
    },
    onSubmit: async ({ value }) => {
      const addressChanged =
        value.address.country !== warehouse.address.country ||
        value.address.state !== warehouse.address.state ||
        value.address.city !== warehouse.address.city ||
        value.address.postalCode !== warehouse.address.postal_code ||
        value.address.address !== warehouse.address.address;

      const detailsChanged =
        value.code !== (warehouse.code ?? "") ||
        value.name !== warehouse.name ||
        value.description !== (warehouse.description ?? "") ||
        addressChanged;

      if (!detailsChanged) {
        return;
      }

      try {
        const result = await updateWarehouse({
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
        });

        if (result?.status !== 200) {
          toast.error("Error al actualizar el almacén.");
          return;
        }

        toast.success("Almacén actualizado correctamente.");
        form.reset({
          code: value.code,
          name: value.name,
          description: value.description,
          address: value.address,
        });
        await mutateWarehouse();
      } catch {
        toast.error("Error al actualizar el almacén.");
      }
    },
  });

  async function handleDelete() {
    setDeletePending(true);
    try {
      const result = await updateWarehouseStatus({ status: "inactive" });

      if (result?.status !== 200) {
        toast.error("Error al eliminar el almacén.");
        return;
      }

      toast.success("Almacén eliminado correctamente.");
      setDeleteOpen(false);
      navigate({ to: "/warehouses" });
    } catch {
      toast.error("No se pudo eliminar el almacén.");
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
            <WarehouseDetailHeader
              warehouse={warehouse}
              isDirty={isDirty}
              isSubmitting={isSubmitting}
              onSave={() => form.handleSubmit()}
              onDiscard={() => form.reset()}
              onDeleteClick={() => setDeleteOpen(true)}
            />
          )}
        </form.Subscribe>

        <Separator />

        <section id="information" className="scroll-mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <WarehouseIcon className="size-4" />
                Información del almacén
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field
                name="code"
                validators={{
                  onChange: ({ value }) => {
                    const result =
                      UpdateWarehouseRequestBody.shape.code.safeParse(
                        value || null
                      );
                    return result.success
                      ? undefined
                      : result.error.issues[0].message;
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
                      disabled={isInactive}
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
                    if (!value.trim()) return "El nombre es requerido";
                    const result =
                      UpdateWarehouseRequestBody.shape.name.safeParse(value);
                    return result.success
                      ? undefined
                      : result.error.issues[0].message;
                  },
                  onSubmit: ({ value }) => {
                    if (!value.trim()) return "El nombre es requerido";
                    const result =
                      UpdateWarehouseRequestBody.shape.name.safeParse(value);
                    return result.success
                      ? undefined
                      : result.error.issues[0].message;
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
                      disabled={isInactive}
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
                      );
                    return result.success
                      ? undefined
                      : result.error.issues[0].message;
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
                      disabled={isInactive}
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
                <Label htmlFor="status">Estado</Label>
                <Select value={warehouse.status} disabled>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue
                      render={() => (
                        <span>
                          {statusLabels[warehouse.status] ?? warehouse.status}
                        </span>
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      {statusLabels.active}
                    </SelectItem>
                    <SelectItem value="inactive">
                      {statusLabels.inactive}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Dirección
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field
                name="address.country"
                validators={{
                  onChange: ({ value }) => {
                    if (!value.trim()) return "El país es requerido";
                    const result =
                      UpdateWarehouseRequestBody.shape.address.shape.country.safeParse(
                        value
                      );
                    return result.success
                      ? undefined
                      : result.error.issues[0].message;
                  },
                  onSubmit: ({ value }) => {
                    if (!value.trim()) return "El país es requerido";
                    const result =
                      UpdateWarehouseRequestBody.shape.address.shape.country.safeParse(
                        value
                      );
                    return result.success
                      ? undefined
                      : result.error.issues[0].message;
                  },
                }}
              >
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>País</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => {
                        if (value) field.handleChange(value);
                      }}
                      disabled={isInactive}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DEFAULT_COUNTRY}>
                          {DEFAULT_COUNTRY}
                        </SelectItem>
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

              <form.Field
                name="address.state"
                validators={{
                  onChange: ({ value }) => {
                    if (!value.trim()) return "El estado es requerido";
                    const result =
                      UpdateWarehouseRequestBody.shape.address.shape.state.safeParse(
                        value
                      );
                    return result.success
                      ? undefined
                      : result.error.issues[0].message;
                  },
                  onSubmit: ({ value }) => {
                    if (!value.trim()) return "El estado es requerido";
                    const result =
                      UpdateWarehouseRequestBody.shape.address.shape.state.safeParse(
                        value
                      );
                    return result.success
                      ? undefined
                      : result.error.issues[0].message;
                  },
                }}
              >
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Estado</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => {
                        if (value) field.handleChange(value);
                      }}
                      disabled={isInactive || isLoadingStates}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue
                          placeholder={
                            isLoadingStates
                              ? "Cargando estados..."
                              : "Selecciona un estado"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.id} value={state.display_name}>
                            {state.display_name}
                          </SelectItem>
                        ))}
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

              <form.Field
                name="address.city"
                validators={{
                  onChange: ({ value }) => {
                    if (!value.trim()) return "La ciudad es requerida";
                    const result =
                      UpdateWarehouseRequestBody.shape.address.shape.city.safeParse(
                        value
                      );
                    return result.success
                      ? undefined
                      : result.error.issues[0].message;
                  },
                  onSubmit: ({ value }) => {
                    if (!value.trim()) return "La ciudad es requerida";
                    const result =
                      UpdateWarehouseRequestBody.shape.address.shape.city.safeParse(
                        value
                      );
                    return result.success
                      ? undefined
                      : result.error.issues[0].message;
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
                      disabled={isInactive}
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
                    if (!value.trim()) return "El código postal es requerido";
                    const result =
                      UpdateWarehouseRequestBody.shape.address.shape.postal_code.safeParse(
                        value
                      );
                    return result.success
                      ? undefined
                      : result.error.issues[0].message;
                  },
                  onSubmit: ({ value }) => {
                    if (!value.trim()) return "El código postal es requerido";
                    const result =
                      UpdateWarehouseRequestBody.shape.address.shape.postal_code.safeParse(
                        value
                      );
                    return result.success
                      ? undefined
                      : result.error.issues[0].message;
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
                      disabled={isInactive}
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
                    if (!value.trim()) return "La dirección es requerida";
                    const result =
                      UpdateWarehouseRequestBody.shape.address.shape.address.safeParse(
                        value
                      );
                    return result.success
                      ? undefined
                      : result.error.issues[0].message;
                  },
                  onSubmit: ({ value }) => {
                    if (!value.trim()) return "La dirección es requerida";
                    const result =
                      UpdateWarehouseRequestBody.shape.address.shape.address.safeParse(
                        value
                      );
                    return result.success
                      ? undefined
                      : result.error.issues[0].message;
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
                      disabled={isInactive}
                    />
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-red-500">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
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
            <DialogTitle>Eliminar almacén</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar &quot;{warehouse.name}
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
