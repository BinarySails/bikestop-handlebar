import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CreateSalesOrderForm } from "@/components/features/sales/create-sales-order-form";

export const Route = createFileRoute("/_layout/sales/new")({
  component: NewSalesOrderPage,
});

function NewSalesOrderPage() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" render={<Link to="/sales" />}>
          <ChevronLeft className="size-4" />
          Regresar
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          Nueva orden de venta
        </h1>
      </div>

      <CreateSalesOrderForm />
    </section>
  );
}
