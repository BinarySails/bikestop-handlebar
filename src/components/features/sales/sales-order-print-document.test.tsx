// @vitest-environment jsdom
/* oxlint-disable vitest/require-mock-type-parameters */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Promotion, SalesOrder } from "@/lib/api/schemas";

import { SalesOrderPrintDocument } from "./sales-order-print-document";

const api = vi.hoisted(() => ({ getPromotion: vi.fn() }));

vi.mock("@/lib/api/api", () => ({ getPromotionRequest: api.getPromotion }));

const promotionId = "promotion-1";
const order = {
  order_number: "PED-100",
  order_date: "2026-10-11T00:00:00Z",
  status: "draft",
  customer: { name: "Cliente" },
  billing_address: {
    address: "Calle 1",
    city: "Guadalajara",
    state: "Jalisco",
    postal_code: "44100",
    country: "México",
  },
  shipping_address: {
    address: "Calle 1",
    city: "Guadalajara",
    state: "Jalisco",
    postal_code: "44100",
    country: "México",
  },
  payment_term: { name: "Contado", days_until_due: null },
  lines: [
    {
      id: "line-1",
      line_number: 1,
      description: "Bicicleta",
      quantity: 1,
      unit_price: 10000,
      tax_rate: 1600,
      discount_amount: 1000,
      line_total: 10600,
      tax_amount: 1600,
      product_id: "product-1",
      variant_id: "variant-1",
      dispatched_quantity: 0,
      warehouse_allocations: [],
      adjustments: [
        {
          id: "adjustment-1",
          amount: 1000,
          source: {
            Promotion: { code: "AUTO10", promotion_id: promotionId },
          },
        },
      ],
    },
  ],
  subtotal: 10000,
  discount_total: 1000,
  tax_total: 1600,
  grand_total: 10600,
} as unknown as SalesOrder;

const promotion = {
  id: promotionId,
  code: "AUTO10",
  is_automatic: true,
  status: "active",
  application_method: {
    Standard: {
      target: "items",
      target_rules: [],
      value: { percentage: 1000 },
    },
  },
} as unknown as Promotion;

describe("SalesOrderPrintDocument discounts", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("prints the applied rate beside each line and breaks out order discounts", async () => {
    api.getPromotion.mockResolvedValue({ status: 200, data: promotion });

    render(<SalesOrderPrintDocument order={order} />);

    expect((await screen.findAllByText(/AUTO10 · 10%/)).length).toBe(2);
    expect(screen.getByText("Descuentos aplicados")).toBeTruthy();
    expect(screen.getAllByText("−$10.00").length).toBe(2);
  });
});
