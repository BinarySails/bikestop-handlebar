import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  emptyRule,
  isMultiValueOperator,
  isOperatorValidForAttribute,
  operatorsForAttribute,
  optionLabel,
  ruleAttributesFor,
  ruleValueKind,
  type DraftRule,
  type RuleSetContext,
} from "./promotion-form";
import { RuleValueInput } from "./rule-value-input";

type RuleSetEditorProps = {
  context: RuleSetContext;
  rules: DraftRule[];
  onChange: (rules: DraftRule[]) => void;
  description?: string;
};

export function RuleSetEditor({
  context,
  rules,
  onChange,
  description,
}: RuleSetEditorProps) {
  const attributes = ruleAttributesFor(context);
  const defaultAttribute = attributes[0]?.value ?? "product_id";

  function updateRule(index: number, next: DraftRule) {
    onChange(rules.map((rule, i) => (i === index ? next : rule)));
  }

  function removeRule(index: number) {
    onChange(rules.filter((_, i) => i !== index));
  }

  function addRule() {
    onChange([...rules, emptyRule(defaultAttribute)]);
  }

  return (
    <div className="space-y-3">
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {rules.length === 0 && (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          {context === "order"
            ? "No hay restricciones. Por default todo tipo de cliente puede usar esta promoción."
            : "No hay restricciones. Por default se aplica a todos los artículos."}
        </p>
      )}

      {rules.map((rule, index) => {
        const valueKind = ruleValueKind(rule.attribute);
        const multi = isMultiValueOperator(rule.operator);
        const invalid =
          rule.values.length === 0 ||
          (rule.attribute === "variant_property" &&
            !rule.variantPropertyName.trim());

        return (
          <div
            key={index}
            className="space-y-3 rounded-lg border bg-muted/20 p-3"
          >
            <div className="flex items-start gap-2">
              <div className="grid flex-1 gap-1.5">
                <Label htmlFor={`${context}-rule-${index}-attribute`}>
                  Atributo
                </Label>
                <Select
                  value={rule.attribute}
                  onValueChange={(value) => {
                    const nextAttribute = value as typeof rule.attribute;
                    updateRule(index, {
                      ...emptyRule(nextAttribute),
                      operator: isOperatorValidForAttribute(
                        rule.operator,
                        nextAttribute
                      )
                        ? rule.operator
                        : "eq",
                      values:
                        ruleValueKind(nextAttribute) === valueKind
                          ? rule.values
                          : [],
                      variantPropertyName: "",
                    });
                  }}
                >
                  <SelectTrigger
                    id={`${context}-rule-${index}-attribute`}
                    className="w-full"
                  >
                    <SelectValue>
                      {optionLabel(attributes, rule.attribute)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {attributes.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid flex-1 gap-1.5">
                <Label htmlFor={`${context}-rule-${index}-operator`}>
                  Operador
                </Label>
                <Select
                  value={rule.operator}
                  onValueChange={(value) =>
                    updateRule(index, {
                      ...rule,
                      operator: value as typeof rule.operator,
                      values:
                        isMultiValueOperator(value as typeof rule.operator) ===
                        multi
                          ? rule.values
                          : [],
                    })
                  }
                >
                  <SelectTrigger
                    id={`${context}-rule-${index}-operator`}
                    className="w-full"
                  >
                    <SelectValue>
                      {optionLabel(
                        operatorsForAttribute(rule.attribute),
                        rule.operator
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {operatorsForAttribute(rule.attribute).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-5 size-9 text-destructive"
                aria-label="Quitar condición"
                onClick={() => removeRule(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            {rule.attribute === "variant_property" && (
              <div className="grid gap-1.5">
                <Label htmlFor={`${context}-rule-${index}-property`}>
                  Nombre de la propiedad
                </Label>
                <Input
                  id={`${context}-rule-${index}-property`}
                  value={rule.variantPropertyName}
                  onChange={(event) =>
                    updateRule(index, {
                      ...rule,
                      variantPropertyName: event.target.value,
                    })
                  }
                  placeholder="color"
                />
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor={`${context}-rule-${index}-values`}>
                {multi ? "Valores" : "Valor"}
              </Label>
              <RuleValueInput
                attribute={rule.attribute}
                operator={rule.operator}
                values={rule.values}
                onChange={(values) => updateRule(index, { ...rule, values })}
              />
              {invalid && (
                <p className="text-xs text-destructive">
                  {multi
                    ? "Agrega al menos un valor."
                    : "Indica un valor para esta condición."}
                </p>
              )}
            </div>
          </div>
        );
      })}

      <Button type="button" variant="outline" size="sm" onClick={addRule}>
        <Plus className="size-4" />
        Agregar condición
      </Button>
    </div>
  );
}
