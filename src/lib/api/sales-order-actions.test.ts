import { afterEach, describe, expect, it, vi } from "vitest";

import { editSalesOrderLinesRequest } from "./api";

describe("editSalesOrderLinesRequest", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends operations with the optimistic concurrency token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "order-1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const payload = {
      expected_updated_at: "2026-10-11T02:25:58.621653Z",
      operations: [
        {
          operation: "update" as const,
          line_id: "line-1",
          line: {
            variant_id: "variant-1",
            warehouse_allocations: [
              { warehouse_id: "warehouse-1", quantity: 3 },
            ],
            description: "Road Bike",
            quantity: 3,
            unit_price: 10000,
            tax_rate: 1600,
          },
        },
      ],
      promotion_codes: [],
    };

    const result = await editSalesOrderLinesRequest("order-1", payload);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/sales-orders/order-1/lines",
      {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    expect(result.status).toBe(200);
    expect(result.data).toEqual({ id: "order-1" });
  });
});
