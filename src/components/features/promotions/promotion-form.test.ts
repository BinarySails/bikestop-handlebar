import { describe, expect, it } from "vitest";

import {
  buildCreatePromotionRequest,
  defaultDraft,
  operatorsForAttribute,
  validateDraft,
  type DraftPromotion,
} from "./promotion-form";

function draft(overrides: Partial<DraftPromotion> = {}): DraftPromotion {
  return {
    ...defaultDraft("amount_off_products"),
    ...overrides,
  };
}

describe("buildCreatePromotionRequest", () => {
  it("omits server-generated ids from rules and application methods", () => {
    const payload = buildCreatePromotionRequest(
      draft({
        kind: "amount_off_products",
        rules: [
          {
            attribute: "customer_id",
            variantPropertyName: "",
            operator: "eq",
            values: ["c1"],
          },
        ],
        target_rules: [
          {
            attribute: "product_id",
            variantPropertyName: "",
            operator: "in",
            values: ["p1", "p2"],
          },
        ],
      })
    );
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toMatch(/"id"/);
  });

  it("maps a fixed amount on items to a Standard method with cents", () => {
    const payload = buildCreatePromotionRequest(
      draft({
        kind: "amount_off_products",
        value: "10.5",
        allocation: "each",
        max_quantity: "3",
        target_rules: [
          {
            attribute: "product_category_id",
            variantPropertyName: "",
            operator: "eq",
            values: ["cat-1"],
          },
        ],
      })
    );
    expect(payload).toMatchObject({
      code: "",
      is_automatic: false,
      status: "active",
      usage_limit: null,
      stacking: "not_combinable",
      application_method: {
        Standard: {
          target: "items",
          value: { fixed_amount: [1050, "MXN"] },
          allocation: "each",
          max_quantity: 3,
          target_rules: [
            {
              attribute: "product_category_id",
              operator: "eq",
              values: [{ uuid: "cat-1" }],
            },
          ],
        },
      },
    });
  });

  it("maps an order-wide fixed amount without allocation or item rules", () => {
    const payload = buildCreatePromotionRequest(
      draft({
        kind: "amount_off_order",
        value: "25",
        allocation: null,
      })
    );
    expect(payload.application_method).toMatchObject({
      Standard: {
        target: "order",
        value: { fixed_amount: [2500, "MXN"] },
        allocation: null,
        max_quantity: null,
        target_rules: [],
      },
    });
  });

  it("converts a percentage to basis points", () => {
    const payload = buildCreatePromotionRequest(
      draft({
        kind: "percentage_off_order",
        value: "10",
      })
    );
    expect(payload.application_method).toMatchObject({
      Standard: {
        target: "order",
        value: { percentage: 1000 },
      },
    });
  });

  it("builds a BuyGet method with separate buy and target rule sets", () => {
    const payload = buildCreatePromotionRequest(
      draft({
        kind: "buy_get",
        value: "100",
        buy_rules_min_quantity: "2",
        apply_to_quantity: "1",
        buy_rules: [
          {
            attribute: "product_id",
            variantPropertyName: "",
            operator: "eq",
            values: ["p1"],
          },
        ],
        target_rules: [
          {
            attribute: "product_brand_id",
            variantPropertyName: "",
            operator: "eq",
            values: ["brand-1"],
          },
        ],
      })
    );
    expect(payload.application_method).toMatchObject({
      BuyGet: {
        buy_rules_min_quantity: 2,
        apply_to_quantity: 1,
        value: { percentage: 10000 },
        buy_rules: [{ attribute: "product_id", operator: "eq" }],
        target_rules: [{ attribute: "product_brand_id", operator: "eq" }],
      },
    });
  });

  it("serializes a combinable stacking with priority", () => {
    const payload = buildCreatePromotionRequest(
      draft({
        kind: "percentage_off_products",
        value: "5",
        stacking: "combinable",
        priority: "2",
      })
    );
    expect(payload.stacking).toEqual({ combinable: { priority: 2 } });
  });

  it("defaults the combinable priority to Normal (3)", () => {
    expect(defaultDraft("amount_off_products").priority).toBe("3");
    expect(
      buildCreatePromotionRequest(draft({ stacking: "combinable" })).stacking
    ).toEqual({ combinable: { priority: 3 } });
  });

  it("serializes a variant_property attribute with its name", () => {
    const payload = buildCreatePromotionRequest(
      draft({
        kind: "percentage_off_products",
        value: "5",
        target_rules: [
          {
            attribute: "variant_property",
            variantPropertyName: "color",
            operator: "eq",
            values: ["rojo"],
          },
        ],
      })
    );
    expect(payload.application_method).toMatchObject({
      Standard: {
        target_rules: [
          {
            attribute: { variant_property: "color" },
            values: [{ string: "rojo" }],
          },
        ],
      },
    });
  });

  it("converts money rule values to cents and quantities to integers", () => {
    const payload = buildCreatePromotionRequest(
      draft({
        kind: "amount_off_products",
        value: "10",
        rules: [
          {
            attribute: "order_subtotal",
            variantPropertyName: "",
            operator: "gte",
            values: ["500"],
          },
        ],
        target_rules: [
          {
            attribute: "line_quantity",
            variantPropertyName: "",
            operator: "gte",
            values: ["2"],
          },
        ],
      })
    );
    const rules = (
      payload.application_method as { Standard: { target_rules: unknown[] } }
    ).Standard.target_rules as Array<{ values: unknown[] }>;
    expect(payload.rules).toMatchObject([
      { attribute: "order_subtotal", values: [{ integer: 50000 }] },
    ]);
    expect(rules).toMatchObject([
      { attribute: "line_quantity", values: [{ integer: 2 }] },
    ]);
  });

  it("sends ISO timestamps and a null limit when dated", () => {
    const startsAt = new Date("2026-08-01T12:00:00Z");
    const payload = buildCreatePromotionRequest(
      draft({
        kind: "percentage_off_products",
        value: "10",
        dated: true,
        starts_at: startsAt,
      })
    );
    expect(payload.starts_at).toBe("2026-08-01T12:00:00.000Z");
    expect(payload.ends_at).toBeNull();
    expect(payload.usage_limit).toBeNull();
  });

  it("sends null dates when not dated even if dates are set", () => {
    const payload = buildCreatePromotionRequest(
      draft({
        kind: "percentage_off_products",
        value: "10",
        dated: false,
        starts_at: new Date("2026-08-01T12:00:00Z"),
        ends_at: new Date("2026-08-10T12:00:00Z"),
      })
    );
    expect(payload.starts_at).toBeNull();
    expect(payload.ends_at).toBeNull();
  });

  it("generates an AUTO code for automatic promotions", () => {
    const payload = buildCreatePromotionRequest(draft({ method: "automatic" }));
    expect(payload.is_automatic).toBe(true);
    expect(payload.code).toMatch(/^AUTO\d+$/);
  });
});

describe("validateDraft", () => {
  it("requires a code without spaces", () => {
    expect(validateDraft(draft({ code: "" })).code).toBeDefined();
    expect(validateDraft(draft({ code: "VERANO 10" })).code).toBeDefined();
    expect(validateDraft(draft({ code: "VERANO10" })).code).toBeUndefined();
  });

  it("validates the discount value by kind", () => {
    expect(validateDraft(draft({ value: "" })).value).toBeDefined();
    expect(
      validateDraft(draft({ kind: "percentage_off_products", value: "101" }))
        .value
    ).toBeDefined();
    expect(
      validateDraft(draft({ kind: "percentage_off_products", value: "10.5" }))
        .value
    ).toBeUndefined();
  });

  it("rejects a combinable priority outside the 1-5 range", () => {
    expect(
      validateDraft(draft({ stacking: "combinable", priority: "1.5" })).priority
    ).toBeDefined();
    expect(
      validateDraft(draft({ stacking: "combinable", priority: "0" })).priority
    ).toBeDefined();
    expect(
      validateDraft(draft({ stacking: "combinable", priority: "6" })).priority
    ).toBeDefined();
    expect(
      validateDraft(draft({ stacking: "combinable", priority: "3" })).priority
    ).toBeUndefined();
  });

  it("requires dates to be ordered only when dated", () => {
    const outOfOrder = {
      starts_at: new Date("2026-08-10T00:00:00Z"),
      ends_at: new Date("2026-08-01T00:00:00Z"),
    };
    expect(
      validateDraft(draft({ ...outOfOrder, dated: true })).dates
    ).toBeDefined();
    expect(
      validateDraft(draft({ ...outOfOrder, dated: false })).dates
    ).toBeUndefined();
  });

  it("skips the code requirement for automatic promotions", () => {
    const errors = validateDraft(draft({ method: "automatic", code: "" }));
    expect(errors.code).toBeUndefined();
  });

  it("requires buy and apply quantities for buy-get", () => {
    const errors = validateDraft(
      draft({
        kind: "buy_get",
        buy_rules_min_quantity: "",
        apply_to_quantity: "",
      })
    );
    expect(errors.buy_rules_min_quantity).toBeDefined();
    expect(errors.apply_to_quantity).toBeDefined();
  });
});

describe("operatorsForAttribute", () => {
  it("offers numeric comparisons only for integer attributes", () => {
    expect(operatorsForAttribute("order_subtotal").map((o) => o.value)).toEqual(
      expect.arrayContaining(["gt", "gte", "lt", "lte"])
    );
    expect(
      operatorsForAttribute("customer_id").map((o) => o.value)
    ).not.toEqual(expect.arrayContaining(["gt", "gte", "lt", "lte"]));
    expect(
      operatorsForAttribute("variant_property").map((o) => o.value)
    ).toEqual(["eq", "ne", "in"]);
  });
});
