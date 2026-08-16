import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  Search,
} from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListSalesOrdersRequest } from "@/lib/api/api";
import { SalesOrderStatus } from "@/lib/api/schemas";
import { centsToPesos } from "@/lib/money";

const PAGE_SIZE = 50;

const salesSearchSchema = z.object({
  page: z.coerce.number().int().nonnegative().optional().catch(0),
  status: z.string().trim().min(1).optional().catch(undefined),
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

type StatusFilter = "all" | keyof typeof SalesOrderStatus;

const statusLabel: Record<keyof typeof SalesOrderStatus, string> = {
  draft: "Borrador",
  quote: "Cotización",
  confirmed: "Confirmada",
  partially_fulfilled: "Parcialmente despachada",
  fulfilled: "Completamente despachada",
  cancelled: "Cancelada",
  closed: "Cerrada",
};

const statusFilterLabel: Record<StatusFilter, string> = {
  all: "Todas",
  ...statusLabel,
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

function toISODateString(date: Date): string {
  return date.toISOString().split("T")[0];
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

function SalesOrdersListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function useDebouncedSearchParam(
  key:
    | "order_number"
    | "customer_username"
    | "customer_company_name"
    | "shipping_state"
    | "shipping_country",
  initialValue?: string
) {
  const [input, setInput] = useState(initialValue ?? "");
  const navigate = useNavigate({ from: Route.fullPath });

  useEffect(() => {
    setInput(initialValue ?? "");
  }, [initialValue]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (input !== (initialValue ?? "")) {
        navigate({
          search: (current) => ({
            ...current,
            [key]: input || undefined,
            page: 0,
          }),
          replace: true,
        });
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [input, initialValue, key, navigate]);

  return [input, setInput] as const;
}

export const Route = createFileRoute("/_layout/sales/")({
  validateSearch: salesSearchSchema,
  component: SalesOrdersPage,
});

function StatusMultiSelect({
  values,
  onChange,
}: {
  values: (keyof typeof SalesOrderStatus)[];
  onChange: (values: (keyof typeof SalesOrderStatus)[]) => void;
}) {
  const label =
    values.length === 0
      ? statusFilterLabel.all
      : values.map((value) => statusLabel[value]).join(", ");

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="w-44 justify-between font-normal"
          >
            <span className="truncate">{label}</span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent className="w-56 p-2" align="start">
        <div className="flex flex-col gap-1">
          {Object.entries(SalesOrderStatus).map(([key, value]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <Checkbox
                checked={values.includes(value)}
                onCheckedChange={(checked) => {
                  onChange(
                    checked
                      ? [...values, value]
                      : values.filter((v) => v !== value)
                  );
                }}
              />
              {statusLabel[key as keyof typeof SalesOrderStatus]}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SalesOrdersPage() {
  const filters = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const page = filters.page ?? 0;

  const [orderNumberInput, setOrderNumberInput] = useDebouncedSearchParam(
    "order_number",
    filters.order_number
  );
  const [customerUsernameInput, setCustomerUsernameInput] =
    useDebouncedSearchParam("customer_username", filters.customer_username);
  const [customerCompanyInput, setCustomerCompanyInput] =
    useDebouncedSearchParam(
      "customer_company_name",
      filters.customer_company_name
    );
  const [shippingStateInput, setShippingStateInput] = useDebouncedSearchParam(
    "shipping_state",
    filters.shipping_state
  );
  const [shippingCountryInput, setShippingCountryInput] =
    useDebouncedSearchParam("shipping_country", filters.shipping_country);

  const selectedStatuses = filters.status
    ? (filters.status.split(",") as (keyof typeof SalesOrderStatus)[])
    : [];

  const {
    data: res,
    error,
    isLoading,
  } = useListSalesOrdersRequest({
    page,
    limit: PAGE_SIZE,
    status: filters.status,
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
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  function handlePageChange(nextPage: number) {
    navigate({
      search: (current) => ({ ...current, page: nextPage }),
      replace: true,
    });
  }

  function handleStatusChange(values: (keyof typeof SalesOrderStatus)[]) {
    navigate({
      search: (current) => ({
        ...current,
        status: values.length > 0 ? values.join(",") : undefined,
        page: 0,
      }),
      replace: true,
    });
  }

  function handleDateFromChange(date?: Date) {
    navigate({
      search: (current) => ({
        ...current,
        order_date_from: date ? toISODateString(date) : undefined,
        page: 0,
      }),
      replace: true,
    });
  }

  function handleDateToChange(date?: Date) {
    navigate({
      search: (current) => ({
        ...current,
        order_date_to: date ? toISODateString(date) : undefined,
        page: 0,
      }),
      replace: true,
    });
  }

  function handleGrandTotalMinChange(value: string) {
    const number = value === "" ? undefined : Number(value);
    navigate({
      search: (current) => ({
        ...current,
        grand_total_min: number && number >= 0 ? number : undefined,
        page: 0,
      }),
      replace: true,
    });
  }

  function handleGrandTotalMaxChange(value: string) {
    const number = value === "" ? undefined : Number(value);
    navigate({
      search: (current) => ({
        ...current,
        grand_total_max: number && number >= 0 ? number : undefined,
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

  const hasFilters =
    filters.status !== undefined ||
    filters.order_number !== undefined ||
    filters.customer_username !== undefined ||
    filters.customer_company_name !== undefined ||
    filters.order_date_from !== undefined ||
    filters.order_date_to !== undefined ||
    filters.grand_total_min !== undefined ||
    filters.grand_total_max !== undefined ||
    filters.shipping_state !== undefined ||
    filters.shipping_country !== undefined;

  return (
    <section
      aria-label="Órdenes de venta"
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Órdenes de venta
          </h1>
        </div>
        <Button render={<Link to="/sales/new" />}>
          <Plus className="size-4" />
          Crear orden
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="order-number-search">Número de orden</Label>
            <div className="relative">
              <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                id="order-number-search"
                placeholder="SO-000000001"
                value={orderNumberInput}
                onChange={(e) => setOrderNumberInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    navigate({
                      search: (current) => ({
                        ...current,
                        order_number: orderNumberInput || undefined,
                        page: 0,
                      }),
                      replace: true,
                    });
                  }
                }}
                className="w-72 pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status">Estatus</Label>
            <StatusMultiSelect
              values={selectedStatuses}
              onChange={handleStatusChange}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">&nbsp;</span>
            <Button
              className="h-8"
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              disabled={!hasFilters}
            >
              Limpiar
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-username">Usuario del cliente</Label>
            <Input
              id="customer-username"
              placeholder="Usuario"
              value={customerUsernameInput}
              onChange={(e) => setCustomerUsernameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  navigate({
                    search: (current) => ({
                      ...current,
                      customer_username: customerUsernameInput || undefined,
                      page: 0,
                    }),
                    replace: true,
                  });
                }
              }}
              className="w-44"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-company">Empresa del cliente</Label>
            <Input
              id="customer-company"
              placeholder="Empresa"
              value={customerCompanyInput}
              onChange={(e) => setCustomerCompanyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  navigate({
                    search: (current) => ({
                      ...current,
                      customer_company_name: customerCompanyInput || undefined,
                      page: 0,
                    }),
                    replace: true,
                  });
                }
              }}
              className="w-44"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="shipping-state">Estado de envío</Label>
            <Input
              id="shipping-state"
              placeholder="Estado"
              value={shippingStateInput}
              onChange={(e) => setShippingStateInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  navigate({
                    search: (current) => ({
                      ...current,
                      shipping_state: shippingStateInput || undefined,
                      page: 0,
                    }),
                    replace: true,
                  });
                }
              }}
              className="w-44"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="shipping-country">País de envío</Label>
            <Input
              id="shipping-country"
              placeholder="País"
              value={shippingCountryInput}
              onChange={(e) => setShippingCountryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  navigate({
                    search: (current) => ({
                      ...current,
                      shipping_country: shippingCountryInput || undefined,
                      page: 0,
                    }),
                    replace: true,
                  });
                }
              }}
              className="w-44"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Desde</Label>
            <DatePicker
              value={
                filters.order_date_from
                  ? parseISODate(filters.order_date_from)
                  : undefined
              }
              onChange={handleDateFromChange}
              placeholder="Fecha inicial"
              className="w-40"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Hasta</Label>
            <DatePicker
              value={
                filters.order_date_to
                  ? parseISODate(filters.order_date_to)
                  : undefined
              }
              onChange={handleDateToChange}
              placeholder="Fecha final"
              className="w-40"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="grand-total-min">Total mínimo</Label>
            <Input
              id="grand-total-min"
              type="number"
              min={0}
              placeholder="0"
              value={filters.grand_total_min ?? ""}
              onChange={(e) => handleGrandTotalMinChange(e.target.value)}
              className="w-36"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="grand-total-max">Total máximo</Label>
            <Input
              id="grand-total-max"
              type="number"
              min={0}
              placeholder="0"
              value={filters.grand_total_max ?? ""}
              onChange={(e) => handleGrandTotalMaxChange(e.target.value)}
              className="w-36"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4">
          {isLoading ? (
            <SalesOrdersListSkeleton />
          ) : error ? (
            <p className="text-sm text-muted-foreground">
              Error al cargar las órdenes de venta.
            </p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay órdenes de venta que coincidan con los filtros.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estatus</TableHead>
                    <TableHead>Orden</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha de creación</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[order.status]}>
                          {statusLabel[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {order.order_number}
                      </TableCell>
                      <TableCell>{order.customer.name}</TableCell>
                      <TableCell>
                        {dateFormatter.format(new Date(order.created_at))}
                      </TableCell>
                      <TableCell>
                        {currencyFormatter.format(
                          centsToPesos(order.grand_total)
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Acciones de ${order.order_number}`}
                                className="size-8"
                              >
                                <MoreVertical className="size-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                navigate({
                                  to: "/sales/$orderId",
                                  params: { orderId: order.id },
                                })
                              }
                            >
                              Ver
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Página {page + 1} de {totalPages} · {total} órdenes
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.max(0, page - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="size-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePageChange(Math.min(totalPages - 1, page + 1))
                    }
                    disabled={page >= totalPages - 1}
                  >
                    Siguiente
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
