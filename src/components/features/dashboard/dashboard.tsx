/* oxlint-disable react/no-unstable-nested-components -- recharts formatter/render callbacks are not components */
import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BadgePercent,
  Banknote,
  Boxes,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import { SiteHeader } from "@/components/features/layout/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetSalesSummaryRequest } from "@/lib/api/api";
import type { SalesSummary } from "@/lib/api/schemas";
import { centsToPesos } from "@/lib/money";

type DashboardProps = {
  from?: string;
  to?: string;
  onRangeChange: (range: { from?: string; to?: string }) => void;
};

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 2,
});
const salesChartConfig = {
  sales: { label: "Ventas", color: "var(--chart-1)" },
} satisfies ChartConfig;

function formatCurrency(value: number) {
  return currencyFormatter.format(centsToPesos(value));
}

function responseError(
  response: { status: number } | undefined,
  error: unknown
) {
  return Boolean(error || (response && response.status !== 200));
}

export function Dashboard({ from, to, onRangeChange }: DashboardProps) {
  const params = from && to ? { from, to } : undefined;
  const summaryQuery = useGetSalesSummaryRequest(params);
  const summary =
    summaryQuery.data?.status === 200 ? summaryQuery.data.data : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SiteHeader title="Dashboard comercial" />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        <DateRangeFilter from={from} to={to} onChange={onRangeChange} />

        <DataSection
          title="Resumen de ventas"
          description="Resultados de pedidos cerrados en el periodo seleccionado."
          isLoading={summaryQuery.isLoading}
          hasError={responseError(summaryQuery.data, summaryQuery.error)}
          onRetry={() => summaryQuery.mutate()}
        >
          {summary && <SalesSummarySection data={summary} />}
        </DataSection>
      </main>
    </div>
  );
}

function DateRangeFilter({
  from,
  to,
  onChange,
}: {
  from?: string;
  to?: string;
  onChange: DashboardProps["onRangeChange"];
}) {
  const [start, setStart] = useState(from ?? "");
  const [end, setEnd] = useState(to ?? "");
  const isIncomplete = Boolean(start) !== Boolean(end);
  const isReversed = Boolean(start && end && start > end);

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dashboard-from">Desde</Label>
            <Input
              id="dashboard-from"
              type="date"
              value={start}
              max={end || undefined}
              onChange={(event) => setStart(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dashboard-to">Hasta</Label>
            <Input
              id="dashboard-to"
              type="date"
              value={end}
              min={start || undefined}
              onChange={(event) => setEnd(event.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => onChange({ from: start, to: end })}
            disabled={!start || !end || isReversed}
          >
            Aplicar rango
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setStart("");
              setEnd("");
              onChange({});
            }}
            disabled={!start && !end && !from && !to}
          >
            Hoy
          </Button>
        </div>
        {(isIncomplete || isReversed) && (
          <p className="text-sm text-destructive" role="alert">
            {isReversed
              ? "La fecha inicial no puede ser posterior a la final."
              : "Selecciona ambas fechas para aplicar el rango."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function DataSection({
  title,
  description,
  isLoading,
  hasError,
  onRetry,
  children,
}: {
  title: string;
  description: string;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4" aria-labelledby={`${title}-title`}>
      <div>
        <h2
          id={`${title}-title`}
          className="text-xl font-semibold tracking-tight"
        >
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : hasError ? (
        <Card>
          <CardContent className="flex min-h-32 flex-col items-center justify-center gap-3 text-center">
            <AlertTriangle className="size-6 text-destructive" />
            <p>No fue posible cargar esta sección.</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw /> Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : (
        children
      )}
    </section>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="grid grid-cols-[1fr_auto] items-start gap-3">
        <div>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="mt-2 text-2xl font-semibold tabular-nums">
            {value}
          </CardTitle>
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
      </CardHeader>
    </Card>
  );
}

function SalesSummarySection({ data }: { data: SalesSummary }) {
  const sellers = [
    ...data.sellers.map((item) => ({
      name: item.current_name ?? "Vendedor eliminado",
      orders: item.order_count,
      sales: item.sales_total,
    })),
    {
      name: "Sin vendedor",
      orders: data.unassigned_seller.order_count,
      sales: data.unassigned_seller.sales_total,
    },
  ];
  const customers = data.customers.map((item) => ({
    name: item.current_name ?? item.snapshot_name ?? "Cliente eliminado",
    orders: item.order_count,
    sales: item.sales_total,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Ventas totales"
          value={formatCurrency(data.sales_total)}
          icon={<Banknote />}
        />
        <MetricCard
          label="Órdenes cerradas"
          value={numberFormatter.format(data.order_count)}
          icon={<ReceiptText />}
        />
        <MetricCard
          label="Unidades vendidas"
          value={numberFormatter.format(data.units_sold)}
          icon={<Boxes />}
        />
        <MetricCard
          label="Subtotal"
          value={formatCurrency(data.subtotal)}
          icon={<ShoppingBag />}
        />
        <MetricCard
          label="Impuestos"
          value={formatCurrency(data.tax_total)}
          icon={<ReceiptText />}
        />
        <MetricCard
          label="Descuentos"
          value={formatCurrency(data.discount_total)}
          icon={<BadgePercent />}
        />
        <MetricCard
          label="Cancelaciones confirmadas"
          value={numberFormatter.format(
            data.cancelled_after_confirmation_order_count
          )}
          icon={<AlertTriangle />}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <RankingChart
          title="Productos más vendidos"
          description="Por importe de venta"
          data={data.products.map((item) => ({
            name: item.name,
            sales: item.sales_total,
            units: item.units_sold,
          }))}
        />
        <RankingChart
          title="Categorías más vendidas"
          description="Por importe de venta"
          data={data.categories.map((item) => ({
            name: item.name,
            sales: item.sales_total,
            units: item.units_sold,
          }))}
        />
        <RankingChart
          title="Ventas por vendedor"
          description="Incluye pedidos sin vendedor asignado"
          data={sellers}
        />
        <RankingChart
          title="Ventas por cliente"
          description="Por importe de venta"
          data={customers}
        />
      </div>
    </div>
  );
}

function RankingChart({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: Array<{ name: string; sales: number; units?: number; orders?: number }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <ChartContainer
            config={salesChartConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 8, right: 52 }}
              accessibilityLayer
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={110}
                tickFormatter={(value: string) =>
                  value.length > 18 ? `${value.slice(0, 18)}…` : value
                }
              />
              <XAxis dataKey="sales" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value) => (
                      <span className="font-mono font-medium">
                        {formatCurrency(Number(value))}
                      </span>
                    )}
                  />
                }
              />
              <Bar dataKey="sales" fill="var(--color-sales)" radius={4}>
                <LabelList
                  dataKey="sales"
                  position="right"
                  formatter={(value) => formatCurrency(Number(value))}
                  className="fill-foreground text-[10px]"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
      Sin datos para el periodo seleccionado
    </div>
  );
}
