import { useState } from "react";
import type { FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { useVendorOptions } from "@/components/features/clients/vendor-lookup";
import { CustomerAddressFormDialog } from "@/components/features/customer/customer-address-form-dialog";
import { CustomerAddressList } from "@/components/features/customer/customer-address-list";
import { EntityCreateButton } from "@/components/features/entity/entity-create-button";
import { EntityDetailHeader } from "@/components/features/entity/entity-detail-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetCustomerRequest,
  useListCustomerAddressesRequest,
  useUpdateCustomerRequest,
} from "@/lib/api/api";
import type { Customer } from "@/lib/api/schemas";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { requirePolicy } from "@/lib/auth/require-auth";

const UNASSIGNED_VALUE = "__unassigned__";

const clientsListSearch = {
  search: undefined,
  status: undefined,
  page: 0,
  limit: 20,
};

export const Route = createFileRoute("/admin/clients/$clientId_/edit")({
  beforeLoad: async ({ location }) => {
    await requirePolicy(PERMISSIONS.customerUpdate, {
      from: location.href,
      navigateTo: "/login",
    });
  },
  component: ClientEditPage,
});

function ClientEditPage() {
  const { clientId } = Route.useParams();
  const navigate = useNavigate();
  const query = useGetCustomerRequest(clientId);
  const customer = query.data?.status === 200 ? query.data.data : null;

  if (query.isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[28rem] w-full rounded-xl" />
      </main>
    );
  }

  if (!customer || query.error || query.data?.status !== 200) {
    const notFound = query.data?.status === 404;

    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">
          {notFound ? "Cliente no encontrado" : "No se pudo cargar el cliente"}
        </h1>
        <Button
          variant="outline"
          render={<Link to="/admin/clients" search={clientsListSearch} />}
        >
          Volver a clientes
        </Button>
      </main>
    );
  }

  return (
    <ClientEditForm
      key={customer.id}
      customer={customer}
      onSaved={() =>
        navigate({ to: "/admin/clients", search: clientsListSearch })
      }
    />
  );
}

function ClientEditForm({
  customer,
  onSaved,
}: {
  customer: Customer;
  onSaved: () => void;
}) {
  const vendorOptionsQuery = useVendorOptions();
  const { trigger: updateCustomer, isMutating } = useUpdateCustomerRequest(
    customer.id
  );

  const [companyName, setCompanyName] = useState(customer.company_name);
  const [taxId, setTaxId] = useState(customer.tax_id ?? "");
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [email, setEmail] = useState(customer.email ?? "");
  const [vendorUserId, setVendorUserId] = useState(
    customer.vendedor_user_id ?? ""
  );
  const [error, setError] = useState<string>();

  const isDirty =
    companyName.trim() !== customer.company_name ||
    taxId.trim() !== (customer.tax_id ?? "") ||
    phone.trim() !== (customer.phone ?? "") ||
    email.trim() !== (customer.email ?? "") ||
    vendorUserId !== (customer.vendedor_user_id ?? "");

  function validate(): string | undefined {
    if (!companyName.trim()) return "El nombre de empresa es requerido.";
    if (companyName.trim().length < 3)
      return "El nombre de empresa debe tener al menos 3 caracteres.";
    if (phone.trim() && (phone.trim().length < 10 || phone.trim().length > 15))
      return "El teléfono debe tener entre 10 y 15 dígitos.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "Ingresa un correo válido.";
    return undefined;
  }

  function reset() {
    setCompanyName(customer.company_name);
    setTaxId(customer.tax_id ?? "");
    setPhone(customer.phone ?? "");
    setEmail(customer.email ?? "");
    setVendorUserId(customer.vendedor_user_id ?? "");
    setError(undefined);
  }

  async function saveChanges() {
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    setError(undefined);
    const result = await updateCustomer({
      company_name: companyName.trim() || null,
      tax_id: taxId.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      vendedor_user_id: vendorUserId || null,
    });

    if (result.status !== 200) {
      setError(
        result.data && "message" in result.data
          ? (result.data.message ?? "No se pudo actualizar el cliente.")
          : "No se pudo actualizar el cliente."
      );
      return;
    }

    toast.success("Cliente actualizado.");
    onSaved();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await saveChanges();
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <EntityDetailHeader
        backTo="/admin/clients"
        backLabel="Volver a clientes"
        title="Editar cliente"
        subtitle={customer.company_name}
        isDirty={isDirty}
        isSubmitting={isMutating}
        onSave={() => saveChanges()}
        onDiscard={reset}
      />

      <Card>
        <CardHeader>
          <CardTitle>Información del cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={submit}>
            <div className="grid gap-2">
              <Label htmlFor="companyName">Nombre de Empresa</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Mi Empresa SA de CV"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="taxId">RFC (opcional)</Label>
              <Input
                id="taxId"
                value={taxId}
                onChange={(event) => setTaxId(event.target.value)}
                placeholder="XAXX010101000"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="5555555555"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="empresa@example.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="vendorUserId">Vendedor</Label>
              <Select
                value={vendorUserId || UNASSIGNED_VALUE}
                onValueChange={(value) => {
                  const next =
                    value === null || value === UNASSIGNED_VALUE ? "" : value;
                  setVendorUserId(next);
                }}
                disabled={
                  vendorOptionsQuery.isLoading || vendorOptionsQuery.roleMissing
                }
              >
                <SelectTrigger id="vendorUserId" className="w-full">
                  <SelectValue
                    placeholder={
                      vendorOptionsQuery.roleMissing
                        ? "No se encontró el rol de vendedor"
                        : vendorOptionsQuery.isLoading
                          ? "Cargando vendedores..."
                          : "Selecciona un vendedor"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED_VALUE}>Sin asignar</SelectItem>
                  {vendorOptionsQuery.options.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <ClientAddressesSection userId={customer.user_id ?? ""} />
    </main>
  );
}

function ClientAddressesSection({ userId }: { userId: string }) {
  const { data, mutate } = useListCustomerAddressesRequest(userId, {
    swr: { enabled: Boolean(userId) },
  });
  const addresses = data?.status === 200 ? data.data : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Direcciones</CardTitle>
        {userId && (
          <CardAction>
            <CustomerAddressFormDialog
              userId={userId}
              mode="create"
              onSuccess={() => mutate()}
              trigger={
                <EntityCreateButton policy={PERMISSIONS.customerUpdate}>
                  Agregar dirección
                </EntityCreateButton>
              }
            />
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {userId ? (
          <CustomerAddressList
            userId={userId}
            addresses={addresses}
            onChanged={() => mutate()}
            emptyMessage="Este cliente aún no tiene direcciones registradas."
          />
        ) : (
          <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Este cliente no tiene un usuario asociado. Asígnale un usuario para
            gestionar sus direcciones.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
