/* oxlint-disable react/no-unstable-nested-components -- column cells are render callbacks, not components */
import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Eye, MoreVertical, ShoppingCart } from "lucide-react";
import { z } from "zod";

import {
  EntityFilterBar,
  type FilterDefinition,
} from "@/components/features/entity/entity-filter-bar";
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
  status: z.string().trim().min(1).optional().catch(undefined),
  tag_ids: z.string().trim().min(1).optional().catch(undefined),
  order_number: z.string().trim().min(1).optional().catch(undefined),
  customer_username: z.string().trim().min(1).optional().catch(undefined),
  customer_company_name: z.string().trim().min(1).optional().catch(undefined),
  order_date_from: z.string().optional().catch(undefined),
  order_date_to: z.string().optional().catch(undefined),
  grand_total_min: z.coerce
    .number()
    .int()
    .nonnegative()
    .optional()
    .catch(undefined),
  grand_total_max: z.coerce
    .number()
    .int()
    .nonnegative()
    .optional()
    .catch(undefined),
  shipping_state: z.string().trim().min(1).optional().catch(undefined),
  shipping_country: z.string().trim().min(1).optional().catch(undefined),
});

const statusLabel: Record<keyof typeof SalesOrderStatus, string> = {
  draft: "Borrador",
  quote: "Cotización",
  confirmed: "Confirmada",
  partially_fulfilled: "Parcialmente despachada",
  fulfilled: "Completamente despachada",
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

function parseISODate(value: string): Date {
  return new Date(value);
}

function toStartOfDayISO(value: string): string {
  const date = parseISODate(value);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
}

function toEndOfDayISO(value: string): string {
  const date = parseISODate(value);
  date.setUTCHours(23, 59, 59, 999);
  return date.toISOString();
}

export const Route = createFileRoute("/admin/sales/")({
  validateSearch: salesSearchSchema,
  component: SalesOrdersPage,
});

const filterDefinitions: FilterDefinition[] = [
  {
    key: "order_number",
    label: "Número de orden",
    type: "text",
    placeholder: "SO-000000001",
  },
  {
    key: "status",
    label: "Estatus",
    type: "select",
    options: Object.entries(SalesOrderStatus).map(([key, value]) => ({
      value,
      label: statusLabel[key as keyof typeof SalesOrderStatus],
    })),
    valueFormatter: (value) =>
      value
        .split(",")
        .map(
          (item) => statusLabel[item.trim() as keyof typeof SalesOrderStatus]
        )
        .join(", "),
  },
  {
    key: "customer_username",
    label: "Usuario del cliente",
    type: "text",
    placeholder: "Usuario",
  },
  {
    key: "customer_company_name",
    label: "Empresa del cliente",
    type: "text",
    placeholder: "Empresa",
  },
  {
    key: "shipping_state",
    label: "Estado de envío",
    type: "state",
  },
  {
    key: "shipping_country",
    label: "País de envío",
    type: "country",
  },
  {
    key: "order_date_from",
    label: "Fecha desde",
    type: "date",
    valueFormatter: (value) =>
      format(parseISODate(value), "dd/MM/yyyy", { locale: es }),
  },
  {
    key: "order_date_to",
    label: "Fecha hasta",
    type: "date",
    valueFormatter: (value) =>
      format(parseISODate(value), "dd/MM/yyyy", { locale: es }),
  },
  {
    key: "grand_total_min",
    label: "Total mínimo",
    type: "number",
    placeholder: "0",
  },
  {
    key: "grand_total_max",
    label: "Total máximo",
    type: "number",
    placeholder: "0",
  },
];

function SalesOrdersPage() {
  const filters = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const page = filters.page ?? 0;

  const filterValues: Partial<Record<string, string>> = {
    order_number: filters.order_number,
    status: filters.status,
    customer_username: filters.customer_username,
    customer_company_name: filters.customer_company_name,
    shipping_state: filters.shipping_state,
    shipping_country: filters.shipping_country,
    order_date_from: filters.order_date_from,
    order_date_to: filters.order_date_to,
    grand_total_min: filters.grand_total_min?.toString(),
    grand_total_max: filters.grand_total_max?.toString(),
  };

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
    status: filters.status,
    tag_ids: filters.tag_ids,
    order_number: filters.order_number,
    customer_username: filters.customer_username,
    customer_company_name: filters.customer_company_name,
    order_date_from: filters.order_date_from
      ? toStartOfDayISO(filters.order_date_from)
      : undefined,
    order_date_to: filters.order_date_to
      ? toEndOfDayISO(filters.order_date_to)
      : undefined,
    grand_total_min: filters.grand_total_min,
    grand_total_max: filters.grand_total_max,
    shipping_state: filters.shipping_state,
    shipping_country: filters.shipping_country,
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

  function handleFilterChange(key: string, value: string | undefined) {
    const parsed =
      key === "grand_total_min" || key === "grand_total_max"
        ? value === undefined || value === "" || Number(value) < 0
          ? undefined
          : Number(value)
        : value;
    navigate({
      search: (current) => ({
        ...current,
        [key]: parsed || undefined,
        page: 0,
      }),
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

  function handleClearFilters() {
    navigate({
      search: { page: 0 },
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
      header: "Término de pago",
      cell: (order) => <span>{order.payment_term.name}</span>,
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
          <div className="flex flex-col gap-3">
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
            <EntityFilterBar
              filters={filterDefinitions}
              values={filterValues}
              pinned={[
                "order_number",
                "status",
                "order_date_from",
                "order_date_to",
                "grand_total_min",
                "grand_total_max",
              ]}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
            />
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
