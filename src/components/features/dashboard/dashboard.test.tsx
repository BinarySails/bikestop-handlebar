// @vitest-environment jsdom
/* oxlint-disable vitest/require-mock-type-parameters */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SalesSummary } from "@/lib/api/schemas";

import { Dashboard } from "./dashboard";

const api = vi.hoisted(() => ({
  summary: vi.fn(),
  mutate: vi.fn(),
}));

vi.mock("@/lib/api/api", () => ({
  useGetSalesSummaryRequest: api.summary,
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
  BarChart: ({
    children,
    data,
  }: {
    children?: React.ReactNode;
    data?: Array<{ name: string }>;
  }) => (
    <div>
      {data?.map((item) => (
        <span key={item.name}>{item.name}</span>
      ))}
      {children}
    </div>
  ),
  CartesianGrid: () => null,
  LabelList: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

const summary = {
  cancelled_after_confirmation_order_count: 2,
  categories: [],
  customers: [
    {
      customer_id: "customer-1",
      current_name: null,
      snapshot_name: "Cliente histórico",
      current_status: null,
      order_count: 2,
      sales_total: 25000,
    },
  ],
  discount_total: 1000,
  from: "2026-08-01",
  order_count: 8,
  products: [],
  sales_total: 125000,
  sellers: [
    {
      seller_id: "seller-1",
      current_name: null,
      current_status: null,
      order_count: 3,
      sales_total: 50000,
    },
  ],
  subtotal: 110000,
  tax_total: 16000,
  timezone: "America/Mexico_City",
  to: "2026-08-31",
  unassigned_seller: { order_count: 1, sales_total: 10000 },
  units_sold: 21,
} satisfies SalesSummary;

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
  });

  afterEach(cleanup);

  it("requests and renders the selected inclusive range", () => {
    render(
      <Dashboard from="2026-08-01" to="2026-08-31" onRangeChange={vi.fn()} />
    );

    const range = { from: "2026-08-01", to: "2026-08-31" };
    expect(api.summary).toHaveBeenCalledWith(range);
    expect(api.summary).toHaveBeenCalledTimes(1);
    expect(screen.getByText("$1,250")).toBeTruthy();
    expect(screen.getByText("Cancelaciones confirmadas")).toBeTruthy();
    expect(screen.getByText("Sin vendedor")).toBeTruthy();
    expect(screen.getByText("Cliente histórico")).toBeTruthy();
    expect(screen.queryByText("Indicadores comerciales")).toBeNull();
    expect(screen.queryByText("Embudo de pedidos")).toBeNull();
    expect(screen.queryByText("Descuentos y promociones")).toBeNull();
  });

  it("calls the endpoints without parameters when using today", () => {
    render(<Dashboard onRangeChange={vi.fn()} />);

    expect(api.summary).toHaveBeenCalledWith(undefined);
    expect(api.summary).toHaveBeenCalledTimes(1);
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
