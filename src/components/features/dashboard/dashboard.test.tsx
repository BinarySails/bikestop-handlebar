// @vitest-environment jsdom
/* oxlint-disable vitest/require-mock-type-parameters */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { OrderFunnel, SalesKpis, SalesSummary } from "@/lib/api/schemas";

import { Dashboard } from "./dashboard";

const api = vi.hoisted(() => ({
  summary: vi.fn(),
  kpis: vi.fn(),
  funnel: vi.fn(),
  mutate: vi.fn(),
}));

vi.mock("@/lib/api/api", () => ({
  useGetSalesSummaryRequest: api.summary,
  useGetSalesKpisRequest: api.kpis,
  useGetOrderFunnelRequest: api.funnel,
}));
vi.mock("@/components/features/layout/site-header", () => ({
  SiteHeader: ({ title }: { title: React.ReactNode }) => <h1>{title}</h1>,
}));
vi.mock("@/components/ui/chart", () => ({
  ChartContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}));
vi.mock("recharts", () => ({
  Bar: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CartesianGrid: () => null,
  LabelList: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

const summary = {
  cancelled_after_confirmation_order_count: 2,
  categories: [],
  customers: [],
  discount_breakdown: {
    attributed_total: 1000,
    unattributed_total: 0,
    reconciled: true,
    by_source: [],
    promotions: [],
  },
  discount_total: 1000,
  from: "2026-08-01",
  order_count: 8,
  products: [],
  sales_total: 125000,
  sellers: [],
  subtotal: 110000,
  tax_total: 16000,
  timezone: "America/Mexico_City",
  to: "2026-08-31",
  unassigned_seller: { order_count: 0, sales_total: 0 },
  units_sold: 21,
} satisfies SalesSummary;

const kpis = {
  average_lines_per_order: 2.5,
  average_net_unit_price: 5952,
  average_order_value: 15625,
  average_units_per_order: 2.63,
  brands: [],
  customer_concentration: {
    top_5_sales_share: 0.5,
    top_5_sales_total: 62500,
    top_10_sales_share: 0.8,
    top_10_sales_total: 100000,
  },
  customers: { total: 6, new: 2, returning: 4, repeat_purchase_rate: 0.4 },
  discount_rate: 0.08,
  from: "2026-08-01",
  line_count: 20,
  order_count: 8,
  payment_terms: [],
  sales_total: 125000,
  tax_rate: 0.16,
  timezone: "America/Mexico_City",
  to: "2026-08-31",
  units_sold: 21,
  variants: [],
} satisfies SalesKpis;

const cycleTime = {
  sample_size: 2,
  average_seconds: 3600,
  median_seconds: 3000,
  p75_seconds: 4000,
  p90_seconds: 5000,
};
const funnel = {
  cancellations: { from_confirmed: 2, from_draft: 1, from_quote: 1, total: 4 },
  conversions: {
    quote_to_confirmed: { cohort_count: 10, converted_count: 8, rate: 0.8 },
    confirmed_to_fulfilled: {
      cohort_count: 8,
      converted_count: 7,
      rate: 0.875,
    },
    fulfilled_to_closed: { cohort_count: 7, converted_count: 6, rate: 0.857 },
    confirmed_to_closed: { cohort_count: 8, converted_count: 6, rate: 0.75 },
  },
  cycle_times: {
    quote_to_confirmed: cycleTime,
    confirmed_to_fulfilled: cycleTime,
    fulfilled_to_closed: cycleTime,
    confirmed_to_closed: cycleTime,
  },
  date_basis: "business_date",
  from: "2026-08-01",
  status_entries: {
    draft: 12,
    quote: 10,
    confirmed: 8,
    partially_fulfilled: 3,
    fulfilled: 7,
    closed: 6,
    cancelled: 4,
  },
  timezone: "America/Mexico_City",
  to: "2026-08-31",
} satisfies OrderFunnel;

function query(data: unknown) {
  return {
    data: { status: 200, data },
    error: undefined,
    isLoading: false,
    mutate: api.mutate,
  };
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.summary.mockReturnValue(query(summary));
    api.kpis.mockReturnValue(query(kpis));
    api.funnel.mockReturnValue(query(funnel));
  });

  afterEach(cleanup);

  it("requests and renders the selected inclusive range", () => {
    render(
      <Dashboard from="2026-08-01" to="2026-08-31" onRangeChange={vi.fn()} />
    );

    const range = { from: "2026-08-01", to: "2026-08-31" };
    expect(api.summary).toHaveBeenCalledWith(range);
    expect(api.kpis).toHaveBeenCalledWith(range);
    expect(api.funnel).toHaveBeenCalledWith(range);
    expect(screen.getByText("$1,250")).toBeTruthy();
    expect(screen.getByText("Ticket promedio")).toBeTruthy();
    expect(screen.getByText("Embudo de pedidos")).toBeTruthy();
  });

  it("calls the endpoints without parameters when using today", () => {
    render(<Dashboard onRangeChange={vi.fn()} />);

    expect(api.summary).toHaveBeenCalledWith(undefined);
    expect(api.kpis).toHaveBeenCalledWith(undefined);
    expect(api.funnel).toHaveBeenCalledWith(undefined);
  });

  it("requires both dates before applying a range", () => {
    const onRangeChange = vi.fn();
    render(<Dashboard onRangeChange={onRangeChange} />);

    fireEvent.change(screen.getByLabelText("Desde"), {
      target: { value: "2026-08-01" },
    });

    expect(screen.getByRole("alert").textContent).toContain("ambas fechas");
    expect(
      (
        screen.getByRole("button", {
          name: "Aplicar rango",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
    expect(onRangeChange).not.toHaveBeenCalled();
  });
});
