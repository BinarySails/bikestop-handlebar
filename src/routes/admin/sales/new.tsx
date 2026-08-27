import { createFileRoute } from "@tanstack/react-router";

import { EntityDetailHeader } from "@/components/features/entity/entity-detail-header";
import { CreateSalesOrderForm } from "@/components/features/sales/create-sales-order-form";

export const Route = createFileRoute("/admin/sales/new")({
  component: NewSalesOrderPage,
});

function NewSalesOrderPage() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <EntityDetailHeader
        backTo="/sales"
        backLabel="Volver a órdenes de venta"
        title="Nueva orden de venta"
      />

      <CreateSalesOrderForm />
    </section>
  );
}
