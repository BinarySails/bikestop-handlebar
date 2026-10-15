import type {
  Product,
  Promotion,
  PromotionRule,
  RuleValue,
  Variant,
} from "@/lib/api/schemas";
import { pesosToCents } from "@/lib/money";

export type PromotionPreviewLine = {
  product: Product | null;
  variant: Variant | null;
  quantity: string;
  unit_price: string;
};

export type AutomaticPromotionPreview = {
  lineDiscounts: number[];
  lineDiscountLabels: string[][];
  totalDiscount: number;
  promotionCodes: string[];
};

function attributeName(rule: PromotionRule): string {
  return typeof rule.attribute === "string"
    ? rule.attribute
    : "variant_property";
}

function values(rule: PromotionRule): (string | number)[] {
  return rule.values.map((value: RuleValue) => {
    if ("uuid" in value) return value.uuid;
    if ("string" in value) return value.string;
    return value.integer;
  });
}

function lineQuantity(line: PromotionPreviewLine): number {
  const quantity = Number(line.quantity);
  return Number.isInteger(quantity) && quantity > 0 ? quantity : 0;
}

function lineUnitPrice(line: PromotionPreviewLine): number {
  const price = Number(line.unit_price);
  return Number.isFinite(price) && price >= 0 ? pesosToCents(price) : 0;
}

function lineGross(line: PromotionPreviewLine): number {
  return lineQuantity(line) * lineUnitPrice(line);
}

function compare(actual: string | number | undefined, rule: PromotionRule) {
  if (actual === undefined) return false;
  const expected = values(rule);
  const same = (value: string | number) => String(actual) === String(value);
  switch (rule.operator) {
    case "eq":
      return expected.some(same);
    case "ne":
      return expected.every((value) => !same(value));
    case "in":
      return expected.some(same);
    case "gt":
      return Number(actual) > Number(expected[0]);
    case "gte":
      return Number(actual) >= Number(expected[0]);
    case "lt":
      return Number(actual) < Number(expected[0]);
    case "lte":
      return Number(actual) <= Number(expected[0]);
  }
}

function orderRuleMatches(
  rule: PromotionRule,
  customerId: string | null,
  subtotal: number
): boolean {
  switch (attributeName(rule)) {
    case "customer_id":
      return compare(customerId ?? undefined, rule);
    case "order_subtotal":
      return compare(subtotal, rule);
    default:
      return false;
  }
}

function lineRuleMatches(rule: PromotionRule, line: PromotionPreviewLine) {
  const attribute = attributeName(rule);
  switch (attribute) {
    case "product_id":
      return compare(line.product?.id, rule);
    case "product_category_id":
      return compare(line.product?.category.id, rule);
    case "product_brand_id":
      return compare(line.product?.brand.id, rule);
    case "variant_id":
      return compare(line.variant?.id, rule);
    case "variant_property": {
      if (typeof rule.attribute === "string") return false;
      const propertyName = rule.attribute.variant_property.toLowerCase();
      const property = line.variant?.properties.find(
        (item) =>
          item.status === "enable" &&
          item.property_name.toLowerCase() === propertyName
      );
      return compare(property?.property_value, rule);
    }
    case "line_quantity":
      return compare(lineQuantity(line), rule);
    case "line_unit_price":
      return compare(lineUnitPrice(line), rule);
    default:
      return false;
  }
}

function rulesMatchOrder(
  rules: PromotionRule[],
  customerId: string | null,
  subtotal: number
) {
  return rules.every((rule) => orderRuleMatches(rule, customerId, subtotal));
}

function rulesMatchLine(rules: PromotionRule[], line: PromotionPreviewLine) {
  return rules.every((rule) => lineRuleMatches(rule, line));
}

function promotionPriority(promotion: Promotion): number {
  return typeof promotion.stacking === "string"
    ? Number.MAX_SAFE_INTEGER
    : promotion.stacking.combinable.priority;
}

function discountAmount(
  value:
    | { percentage: number }
    | { fixed_amount: { [key: string]: unknown }[] },
  base: number
) {
  if ("percentage" in value) {
    return Math.min(base, Math.round((base * value.percentage) / 10000));
  }
  const amount = Number(
    (value.fixed_amount as unknown as [number, string])[0] ?? 0
  );
  return Math.min(base, Number.isFinite(amount) ? amount : 0);
}

export function calculateAutomaticPromotionPreview(
  promotions: Promotion[],
  lines: PromotionPreviewLine[],
  customerId: string | null,
  at = new Date()
): AutomaticPromotionPreview {
  const lineDiscounts = lines.map(() => 0);
  const lineDiscountLabels = lines.map(() => [] as string[]);
  const subtotal = lines.reduce((sum, line) => sum + lineGross(line), 0);
  const eligiblePromotions = promotions
    .filter((promotion) => {
      if (
        promotion.status !== "active" ||
        !promotion.is_automatic ||
        (promotion.usage_limit != null &&
          promotion.used_count >= promotion.usage_limit) ||
        (promotion.starts_at && new Date(promotion.starts_at) > at) ||
        (promotion.ends_at && new Date(promotion.ends_at) < at)
      ) {
        return false;
      }
      return rulesMatchOrder(promotion.rules, customerId, subtotal);
    })
    .sort((a, b) => {
      const aIsNonCombinable = a.stacking === "not_combinable";
      const bIsNonCombinable = b.stacking === "not_combinable";
      if (aIsNonCombinable !== bIsNonCombinable) {
        return aIsNonCombinable ? -1 : 1;
      }
      return promotionPriority(a) - promotionPriority(b);
    });
  const promotionCodes: string[] = [];
  const nonCombinableLines = new Set<number>();

  for (const promotion of eligiblePromotions) {
    const discountBeforePromotion = lineDiscounts.reduce(
      (sum, discount) => sum + discount,
      0
    );
    const lineDiscountsBeforePromotion = [...lineDiscounts];
    const method = promotion.application_method;
    if ("Standard" in method) {
      const standard = method.Standard;
      if (standard.target === "order") {
        const indexes = lines.flatMap((line, index) =>
          !nonCombinableLines.has(index) &&
          lineGross(line) > lineDiscounts[index]
            ? [index]
            : []
        );
        const base = indexes.reduce(
          (sum, index) =>
            sum + Math.max(0, lineGross(lines[index]) - lineDiscounts[index]),
          0
        );
        const discount = discountAmount(standard.value, base);
        if (discount > 0 && base > 0) {
          let remaining = discount;
          const currentBases = indexes.map((index) =>
            Math.max(0, lineGross(lines[index]) - lineDiscounts[index])
          );
          for (let position = 0; position < indexes.length; position++) {
            const index = indexes[position];
            const share =
              position === indexes.length - 1
                ? remaining
                : Math.min(
                    remaining,
                    Math.round((discount * currentBases[position]) / base)
                  );
            const applied = Math.min(currentBases[position], share, remaining);
            lineDiscounts[index] += applied;
            remaining -= applied;
          }
        }
      } else {
        const targetRules = standard.target_rules;
        const indexes = lines.flatMap((line, index) =>
          !nonCombinableLines.has(index) &&
          rulesMatchLine(targetRules, line) &&
          lineGross(line) > lineDiscounts[index]
            ? [index]
            : []
        );
        if (indexes.length === 0) continue;

        if ("percentage" in standard.value) {
          for (const index of indexes) {
            const base = Math.max(
              0,
              lineGross(lines[index]) - lineDiscounts[index]
            );
            lineDiscounts[index] += discountAmount(standard.value, base);
          }
        } else if (standard.allocation === "across") {
          const base = indexes.reduce(
            (sum, index) =>
              sum + Math.max(0, lineGross(lines[index]) - lineDiscounts[index]),
            0
          );
          let remaining = discountAmount(standard.value, base);
          for (let position = 0; position < indexes.length; position++) {
            const index = indexes[position];
            const lineBase = Math.max(
              0,
              lineGross(lines[index]) - lineDiscounts[index]
            );
            const share =
              position === indexes.length - 1
                ? remaining
                : Math.round(
                    (discountAmount(standard.value, base) * lineBase) / base
                  );
            const applied = Math.min(lineBase, share, remaining);
            lineDiscounts[index] += applied;
            remaining -= applied;
          }
        } else {
          const amount = Number(
            (standard.value.fixed_amount as unknown as [number, string])[0] ?? 0
          );
          let remainingQuantity =
            standard.max_quantity ?? Number.MAX_SAFE_INTEGER;
          for (const index of indexes) {
            const line = lines[index];
            const quantity = Math.min(lineQuantity(line), remainingQuantity);
            const base = Math.max(0, lineGross(line) - lineDiscounts[index]);
            lineDiscounts[index] += Math.min(base, amount * quantity);
            remainingQuantity -= quantity;
          }
        }
      }
    } else {
      const buyGet = method.BuyGet;
      const buyQuantity = lines.reduce(
        (sum, line) =>
          sum +
          (rulesMatchLine(buyGet.buy_rules, line) ? lineQuantity(line) : 0),
        0
      );
      if (buyQuantity < buyGet.buy_rules_min_quantity) continue;
      let eligibleQuantity = buyGet.apply_to_quantity;
      const targets = lines.flatMap((line, index) =>
        !nonCombinableLines.has(index) &&
        rulesMatchLine(buyGet.target_rules, line)
          ? [index]
          : []
      );
      for (const index of targets) {
        const quantity = Math.min(lineQuantity(lines[index]), eligibleQuantity);
        if (quantity <= 0) continue;
        const base = Math.max(
          0,
          lineUnitPrice(lines[index]) * quantity - lineDiscounts[index]
        );
        lineDiscounts[index] += discountAmount(buyGet.value, base);
        eligibleQuantity -= quantity;
      }
    }

    const discountAfterPromotion = lineDiscounts.reduce(
      (sum, discount) => sum + discount,
      0
    );
    if (discountAfterPromotion > discountBeforePromotion) {
      promotionCodes.push(promotion.code);
      if (promotion.stacking === "not_combinable") {
        lineDiscounts.forEach((discount, index) => {
          if (discount > lineDiscountsBeforePromotion[index]) {
            nonCombinableLines.add(index);
          }
        });
      }
      const value =
        "Standard" in method ? method.Standard.value : method.BuyGet.value;
      const label =
        "percentage" in value
          ? `${(value.percentage / 100).toFixed(2).replace(/\.?(0+)$/, "")}%`
          : "Monto fijo";
      lineDiscounts.forEach((discount, index) => {
        if (discount > lineDiscountsBeforePromotion[index]) {
          lineDiscountLabels[index].push(label);
        }
      });
    }
  }

  return {
    lineDiscounts,
    lineDiscountLabels,
    totalDiscount: lineDiscounts.reduce((sum, discount) => sum + discount, 0),
    promotionCodes,
  };
}
