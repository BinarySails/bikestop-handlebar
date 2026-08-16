import type {
  ApplicationMethod,
  ApplicationTarget,
  CreatePromotionRequest,
  DiscountValue,
  PromotionRule,
  PromotionStatus,
  RuleAttribute,
  RuleOperator,
  RuleValue,
  Stacking,
} from "@/lib/api/schemas";
import { pesosToCents } from "@/lib/money";

export type PromotionKind =
  | "amount_off_products"
  | "amount_off_order"
  | "percentage_off_products"
  | "percentage_off_order"
  | "buy_get";

export type RuleAttributeKey =
  | "customer_id"
  | "order_subtotal"
  | "product_id"
  | "product_category_id"
  | "product_brand_id"
  | "variant_id"
  | "variant_property"
  | "line_quantity"
  | "line_unit_price";

export type RuleSetContext = "order" | "line";

export type RuleValueKind = "uuid" | "integer" | "string";

export type DraftRule = {
  attribute: RuleAttributeKey;
  variantPropertyName: string;
  operator: RuleOperator;
  values: string[];
};

export type DraftPromotion = {
  kind: PromotionKind;
  method: "code" | "automatic";
  status: PromotionStatus;
  code: string;
  dated: boolean;
  starts_at: Date | null;
  ends_at: Date | null;
  usage_limit: string;
  stacking: "not_combinable" | "combinable";
  priority: string;
  rules: DraftRule[];
  value: string;
  currency: string;
  allocation: "across" | "each" | null;
  max_quantity: string;
  target_rules: DraftRule[];
  buy_rules: DraftRule[];
  buy_rules_min_quantity: string;
  apply_to_quantity: string;
};

export type PromotionTypeOption = {
  value: PromotionKind;
  title: string;
  description: string;
};

export const PROMOTION_TYPE_OPTIONS: PromotionTypeOption[] = [
  {
    value: "amount_off_products",
    title: "Descuento de monto en productos",
    description:
      "Descuenta una cantidad fija del total de los productos que cumplan las condiciones.",
  },
  {
    value: "amount_off_order",
    title: "Descuento de monto en la orden",
    description: "Descuenta una cantidad fija del total de la orden.",
  },
  {
    value: "percentage_off_products",
    title: "Descuento porcentual en productos",
    description:
      "Descuenta un porcentaje del total de los productos que cumplan las condiciones.",
  },
  {
    value: "percentage_off_order",
    title: "Descuento porcentual en la orden",
    description: "Descuenta un porcentaje del total de la orden.",
  },
  {
    value: "buy_get",
    title: "Compra X y obtén Y",
    description:
      "Al comprar una cantidad mínima de un producto, el cliente recibe otros gratis o con descuento.",
  },
];

export const METHOD_OPTIONS = [
  { value: "code", label: "Código de promoción" },
  { value: "automatic", label: "Automática" },
] as const;

export const STATUS_OPTIONS: {
  value: PromotionStatus;
  label: string;
  description: string;
}[] = [
  {
    value: "draft",
    label: "Borrador",
    description: "No se puede usar hasta activarla.",
  },
  {
    value: "active",
    label: "Activa",
    description: "Puede aplicarse a las órdenes.",
  },
  {
    value: "inactive",
    label: "Inactiva",
    description: "No se aplica hasta reactivarla.",
  },
];

export const STACKING_OPTIONS = [
  { value: "not_combinable", label: "No combinable" },
  { value: "combinable", label: "Combinable" },
] as const;

export const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "Muy prioritaria" },
  { value: "2", label: "Prioritaria" },
  { value: "3", label: "Normal" },
  { value: "4", label: "Baja" },
  { value: "5", label: "Muy baja" },
];

export const ORDER_RULE_ATTRIBUTES: {
  value: RuleAttributeKey;
  label: string;
}[] = [
  { value: "customer_id", label: "Cliente" },
  { value: "order_subtotal", label: "Subtotal de la orden" },
];

export const LINE_RULE_ATTRIBUTES: {
  value: RuleAttributeKey;
  label: string;
}[] = [
  { value: "product_id", label: "Producto" },
  { value: "product_category_id", label: "Categoría de producto" },
  { value: "product_brand_id", label: "Marca de producto" },
  { value: "variant_id", label: "Variante" },
  { value: "variant_property", label: "Propiedad de variante" },
  { value: "line_quantity", label: "Cantidad de la línea" },
  { value: "line_unit_price", label: "Precio unitario de la línea" },
];

export const OPERATOR_OPTIONS: { value: RuleOperator; label: string }[] = [
  { value: "eq", label: "Igual a" },
  { value: "ne", label: "Diferente de" },
  { value: "in", label: "Incluido en" },
  { value: "gt", label: "Mayor que" },
  { value: "gte", label: "Mayor o igual que" },
  { value: "lt", label: "Menor que" },
  { value: "lte", label: "Menor o igual que" },
];

export const ALLOCATION_LABELS: Record<"each" | "across", string> = {
  each: "Cada artículo",
  across: "Una sola vez (distribuida)",
};

export function optionLabel<T extends { value: string; label: string }>(
  options: readonly T[],
  value: T["value"] | null | undefined
): string {
  return options.find((option) => option.value === value)?.label ?? "";
}

export function operatorsForAttribute(
  attribute: RuleAttributeKey
): { value: RuleOperator; label: string }[] {
  if (ruleValueKind(attribute) !== "integer") {
    return OPERATOR_OPTIONS.filter(
      (option) =>
        option.value === "eq" || option.value === "ne" || option.value === "in"
    );
  }
  return OPERATOR_OPTIONS;
}

export function isOperatorValidForAttribute(
  operator: RuleOperator,
  attribute: RuleAttributeKey
): boolean {
  return operatorsForAttribute(attribute).some(
    (option) => option.value === operator
  );
}

export function ruleAttributesFor(
  context: RuleSetContext
): { value: RuleAttributeKey; label: string }[] {
  return context === "order" ? ORDER_RULE_ATTRIBUTES : LINE_RULE_ATTRIBUTES;
}

export function ruleValueKind(attribute: RuleAttributeKey): RuleValueKind {
  switch (attribute) {
    case "customer_id":
    case "product_id":
    case "product_category_id":
    case "product_brand_id":
    case "variant_id":
      return "uuid";
    case "order_subtotal":
    case "line_quantity":
    case "line_unit_price":
      return "integer";
    case "variant_property":
      return "string";
  }
}

export function isMultiValueOperator(operator: RuleOperator): boolean {
  return operator === "in";
}

export function emptyRule(attribute: RuleAttributeKey): DraftRule {
  return {
    attribute,
    variantPropertyName: "",
    operator: isMultiValueOperator("in") ? "in" : "eq",
    values: [],
  };
}

export function defaultDraft(kind: PromotionKind): DraftPromotion {
  const isOrder =
    kind === "amount_off_order" || kind === "percentage_off_order";
  return {
    kind,
    method: "code",
    status: "active",
    code: "",
    dated: false,
    starts_at: null,
    ends_at: null,
    usage_limit: "",
    stacking: "not_combinable",
    priority: "3",
    rules: [],
    value: kind === "buy_get" ? "100" : "",
    currency: "MXN",
    allocation: isOrder ? null : "each",
    max_quantity: "",
    target_rules: [],
    buy_rules: [],
    buy_rules_min_quantity: "",
    apply_to_quantity: "",
  };
}

function toRuleAttribute(rule: DraftRule): RuleAttribute {
  if (rule.attribute === "variant_property") {
    return { variant_property: rule.variantPropertyName.trim() };
  }
  return rule.attribute as RuleAttribute;
}

const MONEY_RULE_ATTRIBUTES: RuleAttributeKey[] = [
  "order_subtotal",
  "line_unit_price",
];

function toRuleValues(rule: DraftRule): RuleValue[] {
  switch (ruleValueKind(rule.attribute)) {
    case "uuid":
      return rule.values.map((value) => ({ uuid: value }));
    case "integer":
      return rule.values.map((value) => ({
        integer: MONEY_RULE_ATTRIBUTES.includes(rule.attribute)
          ? pesosToCents(Number(value))
          : Number(value),
      }));
    case "string":
      return rule.values.map((value) => ({ string: value }));
  }
}

function toPromotionRule(rule: DraftRule): PromotionRule {
  return {
    attribute: toRuleAttribute(rule),
    operator: rule.operator,
    values: toRuleValues(rule),
  } as unknown as PromotionRule;
}

function buildDiscountValue(draft: DraftPromotion): DiscountValue {
  const isPercentage =
    draft.kind === "percentage_off_products" ||
    draft.kind === "percentage_off_order" ||
    draft.kind === "buy_get";
  if (isPercentage) {
    return { percentage: Math.round(Number(draft.value) * 100) };
  }
  return {
    fixed_amount: [pesosToCents(Number(draft.value)), draft.currency],
  } as unknown as DiscountValue;
}

function buildStacking(draft: DraftPromotion): Stacking {
  if (draft.stacking === "not_combinable") return "not_combinable";
  return { combinable: { priority: Number(draft.priority) || 0 } };
}

function buildApplicationMethod(draft: DraftPromotion): ApplicationMethod {
  if (draft.kind === "buy_get") {
    return {
      BuyGet: {
        buy_rules: draft.buy_rules.map(toPromotionRule),
        buy_rules_min_quantity: Number(draft.buy_rules_min_quantity),
        target_rules: draft.target_rules.map(toPromotionRule),
        apply_to_quantity: Number(draft.apply_to_quantity),
        value: buildDiscountValue(draft),
      },
    } as unknown as ApplicationMethod;
  }

  const target: ApplicationTarget = draft.kind.endsWith("order")
    ? "order"
    : "items";
  const fixedItems = draft.kind === "amount_off_products";
  const maxQuantity =
    fixedItems && draft.max_quantity.trim() ? Number(draft.max_quantity) : null;

  return {
    Standard: {
      target,
      value: buildDiscountValue(draft),
      target_rules:
        target === "order" ? [] : draft.target_rules.map(toPromotionRule),
      allocation: fixedItems ? draft.allocation : null,
      max_quantity: maxQuantity,
    },
  } as unknown as ApplicationMethod;
}

export function automaticCode(): string {
  return `AUTO${Date.now()}`;
}

export function buildCreatePromotionRequest(
  draft: DraftPromotion
): CreatePromotionRequest {
  return {
    code: draft.method === "automatic" ? automaticCode() : draft.code.trim(),
    is_automatic: draft.method === "automatic",
    status: draft.status,
    starts_at:
      draft.dated && draft.starts_at ? draft.starts_at.toISOString() : null,
    ends_at: draft.dated && draft.ends_at ? draft.ends_at.toISOString() : null,
    usage_limit: draft.usage_limit.trim() ? Number(draft.usage_limit) : null,
    stacking: buildStacking(draft),
    rules: draft.rules.map(toPromotionRule),
    application_method: buildApplicationMethod(draft),
  };
}

export function countDecimals(value: string): number {
  const trimmed = value.trim();
  if (!trimmed.includes(".")) return 0;
  return trimmed.split(".")[1]?.length ?? 0;
}

export type DraftFieldErrors = {
  form?: string;
  code?: string;
  value?: string;
  usage_limit?: string;
  priority?: string;
  max_quantity?: string;
  buy_rules_min_quantity?: string;
  apply_to_quantity?: string;
  dates?: string;
};

export function validateDraft(draft: DraftPromotion): DraftFieldErrors {
  const errors: DraftFieldErrors = {};

  if (draft.method === "code") {
    if (!draft.code.trim()) {
      errors.code = "El código es obligatorio.";
    } else if (/\s/.test(draft.code)) {
      errors.code = "El código no puede contener espacios.";
    }
  }

  if (draft.usage_limit.trim()) {
    const limit = Number(draft.usage_limit);
    if (!Number.isInteger(limit) || limit <= 0) {
      errors.usage_limit = "Debe ser un entero mayor a 0.";
    }
  }

  if (draft.stacking === "combinable") {
    const priority = Number(draft.priority);
    if (!Number.isInteger(priority) || priority < 1 || priority > 5) {
      errors.priority = "Debe ser un entero entre 1 y 5.";
    }
  }

  if (
    draft.dated &&
    draft.starts_at &&
    draft.ends_at &&
    draft.starts_at >= draft.ends_at
  ) {
    errors.dates = "La fecha de inicio debe ser anterior a la de fin.";
  }

  const isPercentage =
    draft.kind.startsWith("percentage") || draft.kind === "buy_get";
  if (!draft.value.trim()) {
    errors.value = isPercentage
      ? "El porcentaje es obligatorio."
      : "El monto es obligatorio.";
  } else if (isPercentage) {
    const percent = Number(draft.value);
    if (Number.isNaN(percent) || percent < 0 || percent > 100) {
      errors.value = "Debe estar entre 0 y 100.";
    } else if (countDecimals(draft.value) > 2) {
      errors.value = "Solo puede tener hasta 2 decimales.";
    }
  } else {
    const amount = Number(draft.value);
    if (Number.isNaN(amount) || amount < 0) {
      errors.value = "Debe ser mayor o igual a 0.";
    } else if (countDecimals(draft.value) > 2) {
      errors.value = "Solo puede tener hasta 2 decimales.";
    }
  }

  if (draft.kind === "amount_off_products") {
    if (draft.allocation === "each" && draft.max_quantity.trim()) {
      const maxQuantity = Number(draft.max_quantity);
      if (!Number.isInteger(maxQuantity) || maxQuantity <= 0) {
        errors.max_quantity = "Debe ser un entero mayor a 0.";
      }
    }
  }

  if (draft.kind === "buy_get") {
    const minQuantity = Number(draft.buy_rules_min_quantity);
    if (
      !draft.buy_rules_min_quantity.trim() ||
      !Number.isInteger(minQuantity) ||
      minQuantity <= 0
    ) {
      errors.buy_rules_min_quantity = "Debe ser un entero mayor a 0.";
    }
    const applyTo = Number(draft.apply_to_quantity);
    if (
      !draft.apply_to_quantity.trim() ||
      !Number.isInteger(applyTo) ||
      applyTo <= 0
    ) {
      errors.apply_to_quantity = "Debe ser un entero mayor a 0.";
    }
  }

  return errors;
}

export function isValidRule(rule: DraftRule): boolean {
  if (
    rule.attribute === "variant_property" &&
    !rule.variantPropertyName.trim()
  ) {
    return false;
  }
  return rule.values.length > 0;
}
