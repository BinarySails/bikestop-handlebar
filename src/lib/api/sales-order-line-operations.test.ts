import { describe, expect, it } from "vitest";

import type { CreateSalesOrderLineRequest, SalesOrderLine } from "@/lib/api/schemas";

import { buildSalesOrderLineOperations } from "./sales-order-line-operations";

function existingLine(id: string, variantId: string): SalesOrderLine {
  return {
    id,
    line_number: 1,
    product_id: "product-1",
    variant_id: variantId,
    sku: "SKU-1",
    description: "Producto",
    quantity: 1,
    dispatched_quantity: 0,
    warehouse_allocations: [
      { warehouse_id: "warehouse-1", quantity: 1, dispatched_quantity: 0 },
    ],
    unit_price: 10000,
    tax_rate: 1600,
    discount_amount: 0,
    tax_amount: 1600,
    line_total: 11600,
    adjustments: [],
  };
}

function nextLine(
  variantId: string,
  overrides: Partial<CreateSalesOrderLineRequest> = {}
): CreateSalesOrderLineRequest {
  return {
    line_id: "line-1",
    variant_id: variantId,
    description: "Producto",
    quantity: 1,
    unit_price: 10000,
    tax_rate: 1600,
    warehouse_allocations: [
      { warehouse_id: "warehouse-1", quantity: 1 },
    ],
    ...overrides,
  };
}

describe("buildSalesOrderLineOperations", () => {
  it("builds update, add, and remove operations for line edits", () => {
    const operations = buildSalesOrderLineOperations(
      [existingLine("line-1", "variant-1"), existingLine("line-2", "variant-2")],
      [
        nextLine("variant-3", { quantity: 3 }),
        nextLine("variant-4", { line_id: null }),
      ]
    );

    expect(operations).toEqual([
      { operation: "remove", line_id: "line-2" },
      {
        operation: "update",
        line_id: "line-1",
        line: {
          variant_id: "variant-3",
          description: "Producto",
          quantity: 3,
          unit_price: 10000,
          tax_rate: 1600,
          warehouse_allocations: [
            { warehouse_id: "warehouse-1", quantity: 1 },
          ],
        },
      },
      {
        operation: "add",
        line: {
          variant_id: "variant-4",
          description: "Producto",
          quantity: 1,
          unit_price: 10000,
          tax_rate: 1600,
          warehouse_allocations: [
            { warehouse_id: "warehouse-1", quantity: 1 },
          ],
        },
      },
    ]);
  });

  it("does not send operations when current lines are unchanged", () => {
    expect(
      buildSalesOrderLineOperations(
        [existingLine("line-1", "variant-1")],
        [nextLine("variant-1")]
      )
    ).toEqual([]);
  });

  it("passes an empty allocation list through for server-side automatic allocation", () => {
    expect(
      buildSalesOrderLineOperations(
        [existingLine("line-1", "variant-1")],
        [nextLine("variant-1", { warehouse_allocations: [] })]
      )
    ).toEqual([
      {
        operation: "update",
        line_id: "line-1",
        line: {
          variant_id: "variant-1",
          description: "Producto",
          quantity: 1,
          unit_price: 10000,
          tax_rate: 1600,
          warehouse_allocations: [],
        },
      },
    ]);
  });
});
