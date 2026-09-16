/* oxlint-disable react/no-unstable-nested-components -- column cells are render callbacks, not components */
import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, MoreVertical, ShoppingCart } from "lucide-react";
import { z } from "zod";

import { SiteHeader } from "@/components/features/layout/site-header";
import { EntityCardTitle } from "@/components/features/entity/entity-card-title";
import { EntityCreateButton } from "@/components/features/entity/entity-create-button";
import {
  EntityIndexPage,
  type EntityColumn,
} from "@/components/features/entity/entity-index-page";
import { AssignOrderTagsDialog } from "@/components/features/sales/tags/assign-order-tags-dialog";
import { OrderTagsSelect } from "@/components/features/sales/tags/order-tags-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useListSalesOrdersRequest } from "@/lib/api/api";
import {
  SalesOrderStatus,
  type SalesOrderSummaryView,
} from "@/lib/api/schemas";
import { centsToPesos } from "@/lib/money";
import { computeDueDate, formatDueDate } from "@/lib/dates";

const PAGE_SIZE = 50;

const salesSearchSchema = z.object({
  page: z.coerce.number().int().nonnegative().optional().catch(0),
  tag_ids: z.string().trim().min(1).optional().catch(undefined),
});

const statusLabel: Record<keyof typeof SalesOrderStatus, string> = {
  draft: "Borrador",
  quote: "Cotización",
  confirmed: "Confirmada",
  partially_fulfilled: "D. Parcial",
  fulfilled: "Completo",
  cancelled: "Cancelada",
  closed: "Cerrada",
};

const statusBadgeVariant: Record<
  keyof typeof SalesOrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  quote: "outline",
  confirmed: "default",
  partially_fulfilled: "default",
  fulfilled: "default",
  cancelled: "destructive",
  closed: "secondary",
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export const Route = createFileRoute("/admin/sales/")({
  validateSearch: salesSearchSchema,
  component: SalesOrdersPage,
});

function SalesOrdersPage() {
  const filters = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const page = filters.page ?? 0;

  const selectedTagIds = filters.tag_ids ? filters.tag_ids.split(",") : [];

  const [assignOrder, setAssignOrder] = useState<SalesOrderSummaryView | null>(
    null
  );

  const {
    data: res,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useListSalesOrdersRequest({
    page,
    limit: PAGE_SIZE,
    tag_ids: filters.tag_ids,
  });

  const orders = res?.status === 200 ? res.data.data : [];
  const total = res?.status === 200 ? res.data.total : 0;
  const hasError = Boolean(error) || Boolean(res && res.status !== 200);

  function handlePageChange(nextPage: number) {
    navigate({
      search: (current) => ({ ...current, page: nextPage }),
      replace: true,
    });
  }

  function handleTagIdsChange(values: string[]) {
    navigate({
      search: (current) => ({
        ...current,
        tag_ids: values.length > 0 ? values.join(",") : undefined,
        page: 0,
      }),
      replace: true,
    });
  }

  const columns: EntityColumn<(typeof orders)[number]>[] = [
    {
      header: "Estatus",
      cell: (order) => (
        <Badge variant={statusBadgeVariant[order.status]}>
          {statusLabel[order.status]}
        </Badge>
      ),
    },
    {
      header: "Orden",
      cell: (order) => (
        <span className="font-medium">{order.order_number}</span>
      ),
    },
    {
      header: "Cliente",
      cell: (order) => <span>{order.customer.name}</span>,
    },
    {
      header: "Fecha de creación",
      cell: (order) => (
        <span>{dateFormatter.format(new Date(order.created_at))}</span>
      ),
    },
    {
      header: "Total",
      cell: (order) => (
        <span className="font-medium">
          {currencyFormatter.format(centsToPesos(order.grand_total))}
        </span>
      ),
    },
    {
      header: "Vence",
      className: "w-32",
      cell: (order) => {
        const dueDate = computeDueDate(
          order.order_date,
          order.payment_term.days_until_due ?? null
        );
        return (
          <span className="text-sm">
            {dueDate ? formatDueDate(dueDate) : "—"}
          </span>
        );
      },
    },
    {
      header: "Etiquetas",
      cell: (order) =>
        order.tags.length === 0 ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {order.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="gap-1 border-transparent pl-1.5"
              >
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{
                    backgroundColor: tag.color ?? undefined,
                  }}
                />
                {tag.display_name}
              </Badge>
            ))}
          </div>
        ),
    },
    {
      header: <span className="sr-only">Acciones</span>,
      className: "w-12",
      cell: (order) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`Acciones de ${order.order_number}`}
              >
                <MoreVertical className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                navigate({
                  to: "/admin/sales/$orderId",
                  params: { orderId: order.id },
                });
              }}
            >
              <Eye />
              Ver
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAssignOrder(order)}>
              Editar etiqueta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <SiteHeader
        title="Órdenes de venta"
        description="Consulta todas tus ordenes de venta pedientes."
        actions={
          <>
            <Button
              render={<Link to="/admin/sales/tags" />}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              Administrar etiquetas
            </Button>
            <EntityCreateButton render={<Link to="/admin/sales/new" />}>
              Crear orden
            </EntityCreateButton>
          </>
        }
      />
      <EntityIndexPage
        ariaLabel="Órdenes de venta"
        cardTitle={
          <EntityCardTitle icon={ShoppingCart}>
            Catálogo de órdenes de venta
          </EntityCardTitle>
        }
        cardHeaderExtras={
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tag-ids" className="text-xs">
              Etiquetas
            </Label>
            <div className="w-56">
              <OrderTagsSelect
                id="tag-ids"
                value={selectedTagIds}
                onChange={handleTagIdsChange}
                placeholder="Filtrar por etiqueta"
              />
            </div>
          </div>
        }
        columns={columns}
        rows={orders}
        rowKey={(order) => order.id}
        loading={isLoading}
        validating={isValidating && Boolean(res)}
        hasError={hasError}
        errorMessage="Error al cargar las órdenes de venta."
        onRetry={() => mutate()}
        emptyMessage="No hay órdenes de venta que coincidan con los filtros."
        pagination={{
          mode: "page",
          total,
          page,
          pageSize: PAGE_SIZE,
          totalLabel: "órdenes",
          onPageChange: handlePageChange,
        }}
      />
      <AssignOrderTagsDialog
        order={assignOrder}
        open={assignOrder !== null}
        onOpenChange={(next) => {
          if (!next) setAssignOrder(null);
        }}
        onSaved={() => mutate()}
      />
    </>
  );
}
