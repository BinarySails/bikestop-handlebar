/* oxlint-disable react/no-unstable-nested-components -- recharts formatter/render callbacks are not components */
import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BadgePercent,
  Banknote,
  Boxes,
  Clock3,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  Users,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetOrderFunnelRequest,
  useGetSalesKpisRequest,
  useGetSalesSummaryRequest,
} from "@/lib/api/api";
import type {
  CycleTimeKpi,
  OrderFunnel,
  SalesKpis,
  SalesSummary,
} from "@/lib/api/schemas";
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
const percentFormatter = new Intl.NumberFormat("es-MX", {
  style: "percent",
  maximumFractionDigits: 1,
});

const salesChartConfig = {
  sales: { label: "Ventas", color: "var(--chart-1)" },
  units: { label: "Unidades", color: "var(--chart-2)" },
  orders: { label: "Pedidos", color: "var(--chart-3)" },
} satisfies ChartConfig;

const funnelChartConfig = {
  value: { label: "Pedidos", color: "var(--chart-2)" },
} satisfies ChartConfig;

function formatCurrency(value: number) {
  return currencyFormatter.format(centsToPesos(value));
}

function formatPercent(value: number) {
  return percentFormatter.format(value);
}

function formatDuration(seconds: number | null | undefined) {
  if (seconds == null) return "Sin datos";
  if (seconds < 60) return `${numberFormatter.format(seconds)} s`;
  if (seconds < 3600) return `${numberFormatter.format(seconds / 60)} min`;
  if (seconds < 86400) return `${numberFormatter.format(seconds / 3600)} h`;
  return `${numberFormatter.format(seconds / 86400)} d`;
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
  const kpisQuery = useGetSalesKpisRequest(params);
  const funnelQuery = useGetOrderFunnelRequest(params);
  const summary =
    summaryQuery.data?.status === 200 ? summaryQuery.data.data : undefined;
  const kpis = kpisQuery.data?.status === 200 ? kpisQuery.data.data : undefined;
  const funnel =
    funnelQuery.data?.status === 200 ? funnelQuery.data.data : undefined;

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

        <DataSection
          title="Indicadores comerciales"
          description="Calidad de venta, recurrencia y composición comercial."
          isLoading={kpisQuery.isLoading}
          hasError={responseError(kpisQuery.data, kpisQuery.error)}
          onRetry={() => kpisQuery.mutate()}
        >
          {kpis && <SalesKpisSection data={kpis} />}
        </DataSection>

        <DataSection
          title="Embudo de pedidos"
          description="Conversión, cancelaciones y tiempos entre estados."
          isLoading={funnelQuery.isLoading}
          hasError={responseError(funnelQuery.data, funnelQuery.error)}
          onRetry={() => funnelQuery.mutate()}
        >
          {funnel && <OrderFunnelSection data={funnel} />}
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
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail?: string;
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
      {detail && (
        <CardContent className="text-xs text-muted-foreground">
          {detail}
        </CardContent>
      )}
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
    ...(data.unassigned_seller.order_count > 0
      ? [
          {
            name: "Sin vendedor",
            orders: data.unassigned_seller.order_count,
            sales: data.unassigned_seller.sales_total,
          },
        ]
      : []),
  ];
  const customers = data.customers.map((item) => ({
    name: item.current_name ?? item.snapshot_name ?? "Cliente eliminado",
    orders: item.order_count,
    sales: item.sales_total,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
          detail={`Impuestos: ${formatCurrency(data.tax_total)}`}
          icon={<ShoppingBag />}
        />
        <MetricCard
          label="Descuentos"
          value={formatCurrency(data.discount_total)}
          detail={`${data.cancelled_after_confirmation_order_count} cancelaciones confirmadas`}
          icon={<BadgePercent />}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <RankingChart
          title="Productos más vendidos"
          description="Top 10 por importe de venta"
          data={data.products.slice(0, 10).map((item) => ({
            name: item.name,
            sales: item.sales_total,
            units: item.units_sold,
          }))}
        />
        <RankingChart
          title="Categorías más vendidas"
          description="Top 10 por importe de venta"
          data={data.categories.slice(0, 10).map((item) => ({
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
          description="Top 10 por importe de venta"
          data={customers.slice(0, 10)}
        />
      </div>
      <DiscountBreakdownCard data={data} />
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

function DiscountBreakdownCard({ data }: { data: SalesSummary }) {
  const breakdown = data.discount_breakdown;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Descuentos y promociones</CardTitle>
        <CardDescription>
          {formatCurrency(breakdown.attributed_total)} atribuidos y{" "}
          {formatCurrency(breakdown.unattributed_total)} sin atribuir
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <SimpleTable
          headers={["Fuente", "Importe", "Pedidos"]}
          rows={breakdown.by_source.map((item) => [
            item.source === "promotion"
              ? "Promoción"
              : item.source === "manual"
                ? "Manual"
                : "Desconocido",
            formatCurrency(item.amount),
            numberFormatter.format(item.order_count),
          ])}
        />
        <SimpleTable
          headers={["Promoción", "Importe", "Pedidos"]}
          rows={breakdown.promotions.map((item) => [
            item.current_code ?? item.promotion_code ?? "Promoción eliminada",
            formatCurrency(item.amount),
            numberFormatter.format(item.order_count),
          ])}
        />
      </CardContent>
    </Card>
  );
}

function SalesKpisSection({ data }: { data: SalesKpis }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Ticket promedio"
          value={formatCurrency(data.average_order_value)}
          icon={<ReceiptText />}
        />
        <MetricCard
          label="Unidades por pedido"
          value={numberFormatter.format(data.average_units_per_order)}
          icon={<Boxes />}
        />
        <MetricCard
          label="Líneas por pedido"
          value={numberFormatter.format(data.average_lines_per_order)}
          icon={<PackageCheck />}
        />
        <MetricCard
          label="Precio neto por unidad"
          value={formatCurrency(data.average_net_unit_price)}
          icon={<Banknote />}
        />
        <MetricCard
          label="Tasa de descuento"
          value={formatPercent(data.discount_rate)}
          icon={<BadgePercent />}
        />
        <MetricCard
          label="Tasa de impuesto"
          value={formatPercent(data.tax_rate)}
          icon={<ReceiptText />}
        />
        <MetricCard
          label="Tasa de recompra"
          value={formatPercent(data.customers.repeat_purchase_rate)}
          detail={`${data.customers.returning} recurrentes de ${data.customers.total}`}
          icon={<RefreshCw />}
        />
        <MetricCard
          label="Clientes nuevos"
          value={numberFormatter.format(data.customers.new)}
          detail={`${data.customers.returning} recurrentes`}
          icon={<Users />}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          label="Concentración top 5"
          value={formatPercent(data.customer_concentration.top_5_sales_share)}
          detail={formatCurrency(data.customer_concentration.top_5_sales_total)}
          icon={<Users />}
        />
        <MetricCard
          label="Concentración top 10"
          value={formatPercent(data.customer_concentration.top_10_sales_share)}
          detail={formatCurrency(
            data.customer_concentration.top_10_sales_total
          )}
          icon={<Users />}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <RankingChart
          title="Términos de pago"
          description="Ventas por término de pago"
          data={data.payment_terms.map((item) => ({
            name: item.name,
            sales: item.sales_total,
            orders: item.order_count,
          }))}
        />
        <RankingChart
          title="Top 10 marcas"
          description="Por importe de venta"
          data={data.brands.slice(0, 10).map((item) => ({
            name: item.name,
            sales: item.sales_total,
            units: item.units_sold,
          }))}
        />
        <RankingChart
          title="Top 10 variantes / SKU"
          description="Por importe de venta"
          data={data.variants.slice(0, 10).map((item) => ({
            name: `${item.sku} · ${item.variant_name}`,
            sales: item.sales_total,
            units: item.units_sold,
          }))}
        />
      </div>
    </div>
  );
}

function OrderFunnelSection({ data }: { data: OrderFunnel }) {
  const entries = [
    { name: "Borrador", value: data.status_entries.draft },
    { name: "Cotización", value: data.status_entries.quote },
    { name: "Confirmado", value: data.status_entries.confirmed },
    { name: "Surtido parcial", value: data.status_entries.partially_fulfilled },
    { name: "Surtido", value: data.status_entries.fulfilled },
    { name: "Cerrado", value: data.status_entries.closed },
    { name: "Cancelado", value: data.status_entries.cancelled },
  ];
  const conversions = [
    ["Cotización → confirmación", data.conversions.quote_to_confirmed],
    ["Confirmación → surtido", data.conversions.confirmed_to_fulfilled],
    ["Surtido → cierre", data.conversions.fulfilled_to_closed],
    ["Confirmación → cierre", data.conversions.confirmed_to_closed],
  ] as const;
  const times = [
    ["Cotización → confirmación", data.cycle_times.quote_to_confirmed],
    ["Confirmación → surtido", data.cycle_times.confirmed_to_fulfilled],
    ["Surtido → cierre", data.cycle_times.fulfilled_to_closed],
    ["Confirmación → cierre", data.cycle_times.confirmed_to_closed],
  ] as const;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Entradas por estado</CardTitle>
            <CardDescription>
              Pedidos que ingresaron a cada etapa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={funnelChartConfig}
              className="aspect-auto h-[320px] w-full"
            >
              <BarChart
                data={entries}
                margin={{ left: 8, right: 8 }}
                accessibilityLayer
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={70}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="value"
                  fill="var(--color-value)"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cancelaciones</CardTitle>
            <CardDescription>
              {data.cancellations.total} cancelaciones en total
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <CancellationRow
              label="Desde borrador"
              value={data.cancellations.from_draft}
            />
            <CancellationRow
              label="Desde cotización"
              value={data.cancellations.from_quote}
            />
            <CancellationRow
              label="Desde confirmado"
              value={data.cancellations.from_confirmed}
            />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {conversions.map(([label, value]) => (
          <MetricCard
            key={label}
            label={label}
            value={formatPercent(value.rate)}
            detail={`${value.converted_count} de ${value.cohort_count} pedidos`}
            icon={<PackageCheck />}
          />
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tiempos operativos</CardTitle>
          <CardDescription>
            Promedio, mediana y percentiles por transición
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transición</TableHead>
                <TableHead>Muestra</TableHead>
                <TableHead>Promedio</TableHead>
                <TableHead>Mediana</TableHead>
                <TableHead>P75</TableHead>
                <TableHead>P90</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {times.map(([label, value]) => (
                <CycleTimeRow key={label} label={label} value={value} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CancellationRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span>{label}</span>
      <strong className="tabular-nums">{numberFormatter.format(value)}</strong>
    </div>
  );
}

function CycleTimeRow({
  label,
  value,
}: {
  label: string;
  value: CycleTimeKpi;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <Clock3 className="mr-2 inline size-4 text-muted-foreground" />
        {label}
      </TableCell>
      <TableCell>{value.sample_size}</TableCell>
      <TableCell>{formatDuration(value.average_seconds)}</TableCell>
      <TableCell>{formatDuration(value.median_seconds)}</TableCell>
      <TableCell>{formatDuration(value.p75_seconds)}</TableCell>
      <TableCell>{formatDuration(value.p90_seconds)}</TableCell>
    </TableRow>
  );
}

function SimpleTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  if (rows.length === 0) return <EmptyState />;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((header) => (
            <TableHead key={header}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, rowIndex) => (
          <TableRow key={`${row[0]}-${rowIndex}`}>
            {row.map((cell, cellIndex) => (
              <TableCell
                key={`${cell}-${cellIndex}`}
                className={cellIndex === 0 ? "font-medium" : "tabular-nums"}
              >
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
      Sin datos para el periodo seleccionado
    </div>
  );
}
