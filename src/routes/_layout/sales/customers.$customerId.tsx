import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Plus, MapPin, Star, Trash2 } from "lucide-react";

import {
  useGetCustomer,
  useListBranches,
  deleteBranch,
  invalidateBranches,
} from "@/lib/api/customers";
import type { Branch } from "@/lib/api/schemas";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateBranchDialog } from "@/components/features/sales/customers/create-branch-dialog";

export const Route = createFileRoute("/_layout/sales/customers/$customerId")({
  component: CustomerDetailPage,
});

function CustomerDetailPage() {
  const { customerId } = Route.useParams();
  const [branchFormOpen, setBranchFormOpen] = useState(false);

  const { data: customerData, isLoading: isLoadingCustomer } =
    useGetCustomer(customerId);
  const {
    data: branchesData,
    isLoading: isLoadingBranches,
    mutate: mutateBranches,
  } = useListBranches(customerId);

  const customer = customerData?.customer;
  const branches = branchesData?.branch ?? [];

  const handleDeleteBranch = async (branch: Branch) => {
    if (!confirm("¿Eliminar esta sucursal?")) return;
    try {
      await deleteBranch(customerId, branch.id);
      invalidateBranches(customerId);
      mutateBranches();
    } catch {
      // Error handled by API
    }
  };

  if (isLoadingCustomer || isLoadingBranches) {
    return (
      <section
        aria-label="Detalle de Cliente"
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6"
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </section>
    );
  }

  if (!customer) {
    return (
      <section
        aria-label="Detalle de Cliente"
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6"
      >
        <div>
          <Button
            variant="ghost"
            size="sm"
            render={<Link to="/sales/customers" />}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="size-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            Cliente no encontrado
          </h1>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Detalle de Cliente"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6"
    >
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link to="/sales/customers" />}
          className="mb-2 -ml-2"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          {customer.company_name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {customer.email || "Sin email"} • {customer.phone || "Sin teléfono"}
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Sucursales</CardTitle>
          <Button size="sm" onClick={() => setBranchFormOpen(true)}>
            <Plus className="size-4" />
            Agregar Sucursal
          </Button>
        </CardHeader>
        <CardContent>
          {branches.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay sucursales registradas.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {branches.map((branch) => (
                <Card key={branch.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                          <MapPin className="size-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {branch.locality_name}, {branch.state_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {branch.address}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {branch.postal_code}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {branch.is_default && (
                          <Star className="size-4 fill-yellow-400 text-yellow-400" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeleteBranch(branch)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateBranchDialog
        open={branchFormOpen}
        onOpenChange={setBranchFormOpen}
        customerId={customerId}
        onSuccess={() => {
          setBranchFormOpen(false);
          mutateBranches();
        }}
      />
    </section>
  );
}
