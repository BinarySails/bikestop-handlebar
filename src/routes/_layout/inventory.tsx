import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";

import { SiteHeader } from "@/components/features/layout/site-header";
import { EntityCardTitle } from "@/components/features/entity/entity-card-title";
import {
  EntityIndexPage,
  type EntityColumn,
} from "@/components/features/entity/entity-index-page";
import type { InventoryTransactionResponse } from "@/lib/api/schemas";

export const Route = createFileRoute("/_layout/inventory")({
  component: InventoryPage,
});

const columns: EntityColumn<InventoryTransactionResponse>[] = [
  {
    header: "Producto",
    cell: () => <span>—</span>,
  },
];

function InventoryPage() {
  return (
    <>
      <SiteHeader
        title="Inventario"
        description="Consulta el inventario y los movimientos de existencias en BikeStop."
      />
      <EntityIndexPage<InventoryTransactionResponse>
        ariaLabel="Inventario"
        cardTitle={
          <EntityCardTitle icon={Package}>
            Movimientos de inventario
          </EntityCardTitle>
        }
        columns={columns}
        rows={[]}
        rowKey={() => "empty"}
        emptyMessage="Aún no hay movimientos de inventario registrados."
      />
    </>
  );
}
