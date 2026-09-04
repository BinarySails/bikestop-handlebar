/* oxlint-disable react/no-unstable-nested-components -- entity-index-page cell renderers are callbacks, not components */
import { useState } from "react";
import { BadgePercent } from "lucide-react";

import { EntityCardTitle } from "@/components/features/entity/entity-card-title";
import { EntityCreateButton } from "@/components/features/entity/entity-create-button";
import {
  EntityIndexPage,
  type EntityColumn,
} from "@/components/features/entity/entity-index-page";
import { SiteHeader } from "@/components/features/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { useListActivePromotionsRequest } from "@/lib/api/api";
import type { Promotion } from "@/lib/api/schemas";
import { centsToPesosString } from "@/lib/money";

import { CreatePromotionDialog } from "./create-promotion-dialog";

function promotionKind(promotion: Promotion): string {
  const method = promotion.application_method;
  if ("BuyGet" in method) return "Compra X obtén Y";
  const target = method.Standard.target;
  const isFixed = "fixed_amount" in method.Standard.value;
  if (target === "order") {
    return isFixed ? "Monto en la orden" : "Porcentaje en la orden";
  }
  return isFixed ? "Monto en productos" : "Porcentaje en productos";
}

function discountValueLabel(promotion: Promotion): string {
  const method = promotion.application_method;
  const value =
    "Standard" in method ? method.Standard.value : method.BuyGet.value;
  if ("percentage" in value) {
    return `${(value.percentage / 100).toFixed(0)}%`;
  }
  const fixed = value.fixed_amount as unknown as [number, string];
  return `$${centsToPesosString(fixed[0] ?? 0)} ${fixed[1] ?? ""}`;
}

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
});

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

export function PromotionsCatalog() {
  const [createOpen, setCreateOpen] = useState(false);
  const listQuery = useListActivePromotionsRequest();
  const promotions =
    listQuery.data?.status === 200 ? listQuery.data.data : undefined;

  const hasError =
    Boolean(listQuery.error) ||
    (Boolean(listQuery.data) && listQuery.data!.status !== 200);

  const columns: EntityColumn<Promotion>[] = [
    {
      header: "Código",
      cell: (promotion) => (
        <div className="flex flex-col">
          <span className="font-medium tracking-tight">{promotion.code}</span>
          <span className="text-xs text-muted-foreground">
            {promotion.is_automatic ? "Automática" : "Código de promoción"}
          </span>
        </div>
      ),
    },
    {
      header: "Tipo",
      cell: (promotion) => promotionKind(promotion),
    },
    {
      header: "Descuento",
      cell: (promotion) => discountValueLabel(promotion),
    },
    {
      header: "Vigencia",
      cell: (promotion) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(promotion.starts_at)} → {formatDate(promotion.ends_at)}
        </span>
      ),
    },
    {
      header: "Uso",
      cell: (promotion) => (
        <span className="tabular-nums">
          {promotion.used_count}
          {promotion.usage_limit != null
            ? ` / ${promotion.usage_limit}`
            : " / ∞"}
        </span>
      ),
    },
    {
      header: "Estado",
      cell: (promotion) => (
        <Badge
          variant={
            promotion.status === "active"
              ? "default"
              : promotion.status === "draft"
                ? "secondary"
                : "outline"
          }
        >
          {promotion.status === "active"
            ? "Activa"
            : promotion.status === "draft"
              ? "Borrador"
              : "Inactiva"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <SiteHeader
        title="Promociones"
        description="Crea descuentos para aplicar a tus órdenes de venta."
        actions={
          <EntityCreateButton onClick={() => setCreateOpen(true)}>
            Nueva promoción
          </EntityCreateButton>
        }
      />
      <EntityIndexPage<Promotion>
        ariaLabel="Promociones"
        cardTitle={
          <EntityCardTitle icon={BadgePercent}>
            Promociones activas
          </EntityCardTitle>
        }
        columns={columns}
        rows={promotions ?? []}
        rowKey={(promotion) => promotion.id}
        loading={listQuery.isLoading}
        validating={listQuery.isValidating && Boolean(promotions)}
        hasError={hasError}
        errorMessage="No se pudieron cargar las promociones. Revisa tu conexión e intenta nuevamente."
        onRetry={() => listQuery.mutate()}
        emptyMessage="No hay promociones activas."
      />
      <CreatePromotionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={async () => {
          await listQuery.mutate();
        }}
      />
    </>
  );
}
