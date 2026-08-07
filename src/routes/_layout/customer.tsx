import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import {
  CustomerCreateForm,
  type CustomerFormValues,
} from "@/components/features/customer/customer-create-form";
import {
  CustomerSettingsCard,
  type CustomerField,
} from "@/components/features/customer/customer-settings-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCreateCustomerRequest,
  useGetCustomerRequest,
  useUpdateCustomerRequest,
  useUpdateCustomerStatusRequest,
} from "@/lib/api/api";
import { useAuthStore } from "@/lib/auth/use-auth-store";
import type {
  CreateCustomerRequest,
  Customer,
  UpdateCustomerRequest,
} from "@/lib/api/schemas";
import type { CustomerStatus } from "@/lib/api/schemas";

export const Route = createFileRoute("/_layout/customer")({
  component: CustomerPage,
});

const statusLabels: Record<CustomerStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
};

function CustomerPage() {
  const actor = useAuthStore((state) => state.actor);
  const userId = actor?.id ?? "";
  const { data: res, error, isLoading, mutate } = useGetCustomerRequest(userId);
  const { trigger: createCustomer } = useCreateCustomerRequest();
  const { trigger: updateCustomer } = useUpdateCustomerRequest(userId);
  const { trigger: updateCustomerStatus } =
    useUpdateCustomerStatusRequest(userId);

  const customer: Customer | null = res?.status === 200 ? res.data : null;

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [statusPending, setStatusPending] = useState(false);

  async function handleCreate(
    values: CustomerFormValues
  ): Promise<string | null> {
    const payload: CreateCustomerRequest = {
      company_name: values.company_name,
      tax_id: values.tax_id,
      phone: values.phone || null,
      email: values.email || null,
    };
    const result = await createCustomer(payload);

    if (result.status === 201) {
      await mutate();
      toast.success("Perfil de cliente creado.");
      return null;
    }

    const message =
      result.data && "message" in result.data
        ? (result.data.message ?? "Error al crear el perfil de cliente.")
        : "Error al crear el perfil de cliente.";
    toast.error(message);
    return message;
  }

  async function handleUpdateField(field: CustomerField, value: string) {
    if (!customer) return;

    const payload: UpdateCustomerRequest = {
      [field]: value === "" ? null : value,
    };
    const result = await updateCustomer(payload);

    if (result.status === 200) {
      await mutate();
      toast.success("Información actualizada.");
      return;
    }

    const message =
      result.data && "message" in result.data
        ? (result.data.message ?? "Error al actualizar la información.")
        : "Error al actualizar la información.";
    toast.error(message);
    throw new Error(message);
  }

  async function handleSetStatus(status: CustomerStatus) {
    setStatusPending(true);
    try {
      const result = await updateCustomerStatus({ status });

      if (result.status === 200) {
        await mutate();
        setDeactivateOpen(false);
        toast.success(
          status === "inactive"
            ? "Perfil de cliente desactivado."
            : "Perfil de cliente reactivado."
        );
        return;
      }

      const message =
        result.data && "message" in result.data
          ? (result.data.message ?? "No se pudo actualizar el estado.")
          : "No se pudo actualizar el estado.";
      toast.error(message);
    } catch {
      toast.error("No se pudo actualizar el estado.");
    } finally {
      setStatusPending(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          Cargando perfil de cliente...
        </p>
      </main>
    );
  }

  if (error || (res && res.status !== 200 && res.status !== 404)) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          No se pudo cargar el perfil de cliente.
        </p>
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="flex flex-1 flex-col p-6 md:p-10">
        <nav aria-label="breadcrumb">
          <p className="text-sm text-muted-foreground">
            Configuración / Cliente
          </p>
        </nav>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Mi Perfil de Cliente
        </h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Aún no tienes un perfil de cliente. Completa los datos de tu empresa
          para empezar a realizar pedidos.
        </p>
        <div className="mt-6 flex justify-center">
          <CustomerCreateForm onSubmit={handleCreate} />
        </div>
      </main>
    );
  }

  const isInactive = customer.status === "inactive";

  return (
    <main className="flex flex-1 flex-col p-6 md:p-10">
      <nav aria-label="breadcrumb">
        <p className="text-sm text-muted-foreground">Configuración / Cliente</p>
      </nav>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
        Mi Perfil de Cliente
      </h1>

      <div className="mt-4 flex flex-col items-center gap-4">
        <div className="flex w-full max-w-5xl items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              Estado del perfil
            </p>
            <Badge variant={isInactive ? "destructive" : "default"}>
              {statusLabels[customer.status]}
            </Badge>
          </div>
          {isInactive ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSetStatus("active")}
              disabled={statusPending}
            >
              {statusPending ? "Reactivando..." : "Reactivar perfil"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeactivateOpen(true)}
            >
              Desactivar perfil
            </Button>
          )}
        </div>

        <CustomerSettingsCard
          customer={customer}
          onUpdateField={handleUpdateField}
          disabled={isInactive}
        />
      </div>

      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desactivar perfil de cliente</DialogTitle>
            <DialogDescription>
              Al desactivar tu perfil de cliente dejarás de poder realizar
              pedidos. Podrás reactivarlo en cualquier momento desde esta misma
              página.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeactivateOpen(false)}
              disabled={statusPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => handleSetStatus("inactive")}
              disabled={statusPending}
            >
              {statusPending ? "Desactivando..." : "Desactivar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
