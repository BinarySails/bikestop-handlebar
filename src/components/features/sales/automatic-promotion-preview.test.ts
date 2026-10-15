import { describe, expect, it } from "vitest";

import type { Product, Promotion, Variant } from "@/lib/api/schemas";

import { calculateAutomaticPromotionPreview } from "./automatic-promotion-preview";

const product = {
  id: "product-1",
  brand: { id: "brand-1" },
  category: { id: "category-1" },
} as unknown as Product;

const variant = {
  id: "variant-1",
  properties: [],
} as unknown as Variant;

function promotion(overrides: Partial<Promotion> = {}): Promotion {
  return {
    id: "promotion-1",
    code: "AUTO20",
    is_automatic: true,
    status: "active",
    used_count: 0,
    usage_limit: null,
    starts_at: null,
    ends_at: null,
    stacking: "not_combinable",
    rules: [],
    application_method: {
      Standard: {
        target: "items",
        target_rules: [
          {
            attribute: "variant_id",
            operator: "eq",
            values: [{ uuid: "variant-1" }],
          },
        ],
        value: { percentage: 2000 },
      },
    },
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("calculateAutomaticPromotionPreview", () => {
  it("applies an active automatic discount to matching variant lines", () => {
    const result = calculateAutomaticPromotionPreview(
      [promotion()],
      [
        {
          product,
          variant,
          quantity: "2",
          unit_price: "10.00",
        },
        {
          product,
          variant: { ...variant, id: "variant-2" },
          quantity: "1",
          unit_price: "10.00",
        },
      ],
      null,
      new Date("2026-06-01T00:00:00Z")
    );

    expect(result).toEqual({
      lineDiscounts: [400, 0],
      lineDiscountLabels: [["20%"], []],
      totalDiscount: 400,
      promotionCodes: ["AUTO20"],
    });
  });

  it("applies different non-combinable discounts to their matching lines", () => {
    const secondPromotion = promotion({
      code: "AUTO10",
      stacking: "not_combinable",
      application_method: {
        Standard: {
          target: "items",
          target_rules: [
            {
              attribute: "variant_id",
              operator: "eq",
              values: [{ uuid: "variant-2" }],
            },
          ],
          value: { percentage: 1000 },
        },
      },
    });
    const result = calculateAutomaticPromotionPreview(
      [promotion(), secondPromotion],
      [
        { product, variant, quantity: "1", unit_price: "10.00" },
        {
          product,
          variant: { ...variant, id: "variant-2" },
          quantity: "1",
          unit_price: "10.00",
        },
      ],
      null,
      new Date("2026-06-01T00:00:00Z")
    );

    expect(result.lineDiscounts).toEqual([200, 100]);
    expect(result.lineDiscountLabels).toEqual([["20%"], ["10%"]]);
    expect(result.promotionCodes).toEqual(["AUTO20", "AUTO10"]);
  });

  it("does not stack non-combinable promotions on the same line", () => {
    const secondPromotion = promotion({
      code: "AUTO10",
      application_method: {
        Standard: {
          target: "items",
          target_rules: [],
          value: { percentage: 1000 },
        },
      },
    });
    const result = calculateAutomaticPromotionPreview(
      [
        promotion({
          application_method: {
            Standard: {
              target: "items",
              target_rules: [],
              value: { percentage: 2000 },
            },
          },
        }),
        secondPromotion,
      ],
      [{ product, variant, quantity: "1", unit_price: "10.00" }],
      null,
      new Date("2026-06-01T00:00:00Z")
    );

    expect(result.lineDiscounts).toEqual([200]);
    expect(result.promotionCodes).toEqual(["AUTO20"]);
  });

  it("labels fixed discounts by their applied amount", () => {
    const fixedPromotion = promotion({
      code: "AUTO5",
      application_method: {
        Standard: {
          target: "items",
          target_rules: [],
          value: { fixed_amount: [500, "MXN"] } as unknown as {
            fixed_amount: { [key: string]: unknown }[];
          },
          allocation: "each",
        },
      },
    });

    const result = calculateAutomaticPromotionPreview(
      [fixedPromotion],
      [{ product, variant, quantity: "1", unit_price: "10.00" }],
      null,
      new Date("2026-06-01T00:00:00Z")
    );

    expect(result.lineDiscounts).toEqual([500]);
    expect(result.lineDiscountLabels).toEqual([["Monto fijo"]]);
  });

  it("does not preview inactive or non-automatic promotions", () => {
    const result = calculateAutomaticPromotionPreview(
      [
        promotion({ status: "inactive" }),
        promotion({ code: "CODE", is_automatic: false }),
      ],
      [{ product, variant, quantity: "1", unit_price: "10.00" }],
      null,
      new Date("2026-06-01T00:00:00Z")
    );

    expect(result.totalDiscount).toBe(0);
    expect(result.promotionCodes).toEqual([]);
  });
});
