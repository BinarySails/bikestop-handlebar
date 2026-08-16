import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPromotionRequest } from "@/lib/api/api";
import type { ErrorResponse } from "@/lib/api/schemas";
import { cn } from "@/lib/utils";

import { PromotionTypePicker } from "./promotion-type-picker";
import {
  METHOD_OPTIONS,
  STATUS_OPTIONS,
  STACKING_OPTIONS,
  ALLOCATION_LABELS,
  PRIORITY_OPTIONS,
  PROMOTION_TYPE_OPTIONS,
  defaultDraft,
  validateDraft,
  isValidRule,
  buildCreatePromotionRequest,
  optionLabel,
  type DraftFieldErrors,
  type PromotionKind,
} from "./promotion-form";
import { RuleSetEditor } from "./rule-set-editor";

function WizardSteps({ step }: { step: 1 | 2 }) {
  const steps = [
    { number: 1, label: "Tipo de promoción" },
    { number: 2, label: "Detalles" },
  ];
  return (
    <ol className="flex items-center gap-2 text-sm">
      {steps.map((item, index) => {
        const isActive = step === item.number;
        const isDone = step > item.number;
        return (
          <li key={item.number} className="flex items-center gap-2">
            {index > 0 && (
              <span className="text-muted-foreground" aria-hidden="true">
                /
              </span>
            )}
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full text-xs font-semibold",
                  isActive || isDone
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {item.number}
              </span>
              <span
                className={cn(
                  "hidden sm:inline",
                  isActive ? "font-medium" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function CreatePromotionForm({
  onSaved,
}: {
  onSaved?: () => Promise<void> | void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [kind, setKind] = useState<PromotionKind | null>(null);

  const kindTitle = kind
    ? (PROMOTION_TYPE_OPTIONS.find((option) => option.value === kind)?.title ??
      "")
    : "";

  if (step === 2 && kind) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <WizardSteps step={2} />
          <Button type="button" variant="ghost" onClick={() => setStep(1)}>
            <ArrowLeft className="size-4" />
            Cambiar tipo
          </Button>
        </div>
        <PromotionDetailsForm
          key={kind}
          kind={kind}
          kindTitle={kindTitle}
          onSaved={onSaved}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WizardSteps step={1} />
      <Card>
        <CardHeader>
          <CardTitle>Elige el tipo de promoción</CardTitle>
        </CardHeader>
        <CardContent>
          <PromotionTypePicker value={kind} onChange={setKind} />
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button
          type="button"
          disabled={!kind}
          onClick={() => {
            if (kind) setStep(2);
          }}
        >
          Continuar
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

type PromotionDetailsFormProps = {
  kind: PromotionKind;
  kindTitle: string;
  onSaved?: () => Promise<void> | void;
};

function PromotionDetailsForm({
  kind,
  kindTitle,
  onSaved,
}: PromotionDetailsFormProps) {
  const [submissionErrors, setSubmissionErrors] = useState<DraftFieldErrors>(
    {}
  );
  const isPercentage = kind.startsWith("percentage") || kind === "buy_get";
  const isOrder =
    kind === "amount_off_order" || kind === "percentage_off_order";
  const isBuyGet = kind === "buy_get";
  const fixedItems = kind === "amount_off_products";

  const form = useForm({
    defaultValues: defaultDraft(kind),
    onSubmit: async ({ value }) => {
      setSubmissionErrors({});
      const errors = validateDraft(value);
      if (Object.keys(errors).length > 0) {
        setSubmissionErrors(errors);
        return;
      }

      const invalidRuleSet = [
        ...value.rules,
        ...value.target_rules,
        ...value.buy_rules,
      ].some((rule) => !isValidRule(rule));
      if (invalidRuleSet) {
        toast.error("Completa todas las condiciones de la promoción.");
        return;
      }

      try {
        const result = await createPromotionRequest(
          buildCreatePromotionRequest(value)
        );
        if (result.status === 201) {
          toast.success(`Promoción ${result.data.code} creada.`);
          await onSaved?.();
          return;
        }
        const message =
          "data" in result &&
          typeof result.data === "object" &&
          result.data !== null &&
          "message" in result.data
            ? (result.data as ErrorResponse).message
            : undefined;
        if (result.status === 409) {
          setSubmissionErrors({
            code: "Ya existe una promoción con este código.",
          });
        } else {
          setSubmissionErrors({
            form:
              message ?? "No se pudo crear la promoción. Intenta nuevamente.",
          });
        }
      } catch {
        setSubmissionErrors({
          form: "No se pudo crear la promoción. Intenta nuevamente.",
        });
      }
    },
  });

  function fieldError(name: keyof DraftFieldErrors): string | undefined {
    return submissionErrors[name];
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>{kindTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <form.Field
            name="method"
            validators={{
              onSubmit: ({ value }) => {
                if (!value) return "Elige cómo se aplicará.";
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Método</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(next) =>
                    field.handleChange(next as typeof field.state.value)
                  }
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue>
                      {optionLabel(METHOD_OPTIONS, field.state.value)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {METHOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name="status">
            {(field) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Estado</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(next) =>
                    field.handleChange(next as typeof field.state.value)
                  }
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue>
                      {optionLabel(STATUS_OPTIONS, field.state.value)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => state.values.method}>
            {(method) =>
              method === "code" ? (
                <form.Field
                  name="code"
                  validators={{
                    onSubmit: ({ value }) => {
                      if (!value.trim()) return "El código es obligatorio.";
                      if (/\s/.test(value)) {
                        return "El código no puede contener espacios.";
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <div className="grid gap-1.5">
                      <Label htmlFor={field.name}>Código</Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        placeholder="VERANO10"
                        aria-invalid={Boolean(
                          field.state.meta.errors[0] || fieldError("code")
                        )}
                      />
                      {(field.state.meta.errors[0] || fieldError("code")) && (
                        <p className="text-xs text-destructive">
                          {field.state.meta.errors[0] || fieldError("code")}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Sin espacios, por ejemplo VERANO10.
                      </p>
                    </div>
                  )}
                </form.Field>
              ) : (
                <div className="grid content-start gap-1.5">
                  <Label>Código</Label>
                  <p className="text-xs text-muted-foreground">
                    Se generará automáticamente un código único.
                  </p>
                </div>
              )
            }
          </form.Subscribe>

          <form.Field
            name="usage_limit"
            validators={{
              onSubmit: ({ value }) => {
                if (value.trim()) {
                  const limit = Number(value);
                  if (!Number.isInteger(limit) || limit <= 0) {
                    return "Debe ser un entero mayor a 0.";
                  }
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Límite de uso</Label>
                <Input
                  id={field.name}
                  type="number"
                  min={1}
                  step={1}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Opcional"
                />
                <p className="text-xs text-muted-foreground">
                  Máximo de veces que puede usarse en todas las órdenes.
                </p>
              </div>
            )}
          </form.Field>

          <form.Field name="dated">
            {(field) => (
              <div className="grid gap-1.5 sm:col-span-2">
                <Label
                  htmlFor={field.name}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <Checkbox
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === true)
                    }
                  />
                  Programar fechas de vigencia
                </Label>
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => state.values.dated}>
            {(dated) =>
              dated ? (
                <>
                  <form.Field name="starts_at">
                    {(field) => (
                      <div className="grid gap-1.5">
                        <Label htmlFor={field.name}>Válida desde</Label>
                        <DatePicker
                          value={field.state.value ?? undefined}
                          onChange={(date) => field.handleChange(date ?? null)}
                          placeholder="Fecha de inicio"
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="ends_at">
                    {(field) => (
                      <div className="grid gap-1.5">
                        <Label htmlFor={field.name}>Válida hasta</Label>
                        <DatePicker
                          value={field.state.value ?? undefined}
                          onChange={(date) => field.handleChange(date ?? null)}
                          placeholder="Fecha de fin"
                        />
                      </div>
                    )}
                  </form.Field>

                  {fieldError("dates") && (
                    <p className="text-sm text-destructive sm:col-span-2">
                      {fieldError("dates")}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground sm:col-span-2">
                  Sin fechas: la promoción estará vigente por tiempo indefinido.
                </p>
              )
            }
          </form.Subscribe>

          <div className="grid gap-1.5 sm:col-span-2">
            <form.Subscribe selector={(state) => state.values.stacking}>
              {(stacking) => (
                <>
                  <form.Field name="stacking">
                    {(field) => (
                      <div className="grid gap-1.5">
                        <Label htmlFor={field.name}>Apilamiento</Label>
                        <Select
                          value={field.state.value}
                          onValueChange={(next) =>
                            field.handleChange(next as typeof field.state.value)
                          }
                        >
                          <SelectTrigger id={field.name} className="w-full">
                            <SelectValue>
                              {optionLabel(STACKING_OPTIONS, field.state.value)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {STACKING_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {stacking === "combinable"
                            ? "Puede combinarse con otras promociones según su prioridad."
                            : "No puede combinarse con otras promociones."}
                        </p>
                      </div>
                    )}
                  </form.Field>

                  {stacking === "combinable" && (
                    <form.Field
                      name="priority"
                      validators={{
                        onSubmit: ({ value }) => {
                          const priority = Number(value);
                          if (
                            !Number.isInteger(priority) ||
                            priority < 1 ||
                            priority > 5
                          ) {
                            return "Debe estar entre 1 y 5.";
                          }
                          return undefined;
                        },
                      }}
                    >
                      {(field) => (
                        <div className="grid gap-1.5">
                          <Label htmlFor={field.name}>
                            Prioridad de aplicación
                          </Label>
                          <Select
                            value={field.state.value}
                            onValueChange={(next) =>
                              field.handleChange(
                                next as typeof field.state.value
                              )
                            }
                          >
                            <SelectTrigger id={field.name} className="w-full">
                              <SelectValue>
                                {optionLabel(
                                  PRIORITY_OPTIONS,
                                  field.state.value
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {PRIORITY_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Normal por default. Controla el orden en el que se
                            aplican las promociones: un orden distinto puede
                            cambiar el resultado final.
                          </p>
                          {field.state.meta.errors[0] && (
                            <p className="text-xs text-destructive">
                              {field.state.meta.errors[0]}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>
                  )}
                </>
              )}
            </form.Subscribe>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quién puede usar el código</CardTitle>
        </CardHeader>
        <CardContent>
          <form.Field name="rules">
            {(field) => (
              <RuleSetEditor
                context="order"
                rules={field.state.value}
                onChange={field.handleChange}
                description="Condiciones de la orden que deben cumplirse para que la promoción aplique."
              />
            )}
          </form.Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Valor de la promoción</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <form.Field
            name="value"
            validators={{
              onSubmit: ({ value }) => {
                const number = Number(value);
                if (!value.trim()) {
                  return isPercentage
                    ? "El porcentaje es obligatorio."
                    : "El monto es obligatorio.";
                }
                if (isPercentage) {
                  if (Number.isNaN(number) || number < 0 || number > 100) {
                    return "Debe estar entre 0 y 100.";
                  }
                } else if (Number.isNaN(number) || number < 0) {
                  return "Debe ser mayor o igual a 0.";
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>
                  {isBuyGet
                    ? "Descuento de los artículos obtenidos"
                    : isPercentage
                      ? "Porcentaje de descuento"
                      : "Monto de descuento"}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={field.name}
                    type="number"
                    min={0}
                    max={isPercentage ? 100 : undefined}
                    step="0.01"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={Boolean(
                      field.state.meta.errors[0] || fieldError("value")
                    )}
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    {isPercentage ? "%" : "MXN"}
                  </span>
                </div>
                {(field.state.meta.errors[0] || fieldError("value")) && (
                  <p className="text-xs text-destructive">
                    {field.state.meta.errors[0] || fieldError("value")}
                  </p>
                )}
                {isBuyGet && (
                  <p className="text-xs text-muted-foreground">
                    100% significa que los artículos obtenidos son gratis.
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {fixedItems && (
            <>
              <form.Field name="allocation">
                {(field) => (
                  <div className="grid gap-1.5">
                    <Label htmlFor={field.name}>Distribución</Label>
                    <Select
                      value={field.state.value ?? "each"}
                      onValueChange={(next) =>
                        field.handleChange(
                          (next === "across" || next === "each"
                            ? next
                            : null) as typeof field.state.value
                        )
                      }
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue>
                          {ALLOCATION_LABELS[field.state.value ?? "each"]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="each">Cada artículo</SelectItem>
                        <SelectItem value="across">
                          Una sola vez (distribuida)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Cada artículo aplica el monto a cada unidad elegible; una
                      sola vez reparte el monto total entre los artículos
                      elegibles.
                    </p>
                  </div>
                )}
              </form.Field>

              <form.Subscribe selector={(state) => state.values.allocation}>
                {(allocation) =>
                  allocation === "each" ? (
                    <form.Field
                      name="max_quantity"
                      validators={{
                        onSubmit: ({ value }) => {
                          if (value.trim()) {
                            const maxQuantity = Number(value);
                            if (
                              !Number.isInteger(maxQuantity) ||
                              maxQuantity <= 0
                            ) {
                              return "Debe ser un entero mayor a 0.";
                            }
                          }
                          return undefined;
                        },
                      }}
                    >
                      {(field) => (
                        <div className="grid gap-1.5">
                          <Label htmlFor={field.name}>Cantidad máxima</Label>
                          <Input
                            id={field.name}
                            type="number"
                            min={1}
                            step={1}
                            value={field.state.value}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                            placeholder="Opcional"
                          />
                          <p className="text-xs text-muted-foreground">
                            Cantidad de unidades a las que aplica en cada
                            artículo elegible.
                          </p>
                        </div>
                      )}
                    </form.Field>
                  ) : null
                }
              </form.Subscribe>
            </>
          )}
        </CardContent>
      </Card>

      {!isOrder && !isBuyGet && (
        <Card>
          <CardHeader>
            <CardTitle>A qué artículos se aplica</CardTitle>
          </CardHeader>
          <CardContent>
            <form.Field name="target_rules">
              {(field) => (
                <RuleSetEditor
                  context="line"
                  rules={field.state.value}
                  onChange={field.handleChange}
                  description="Condiciones que deben cumplir los artículos del carrito para recibir el descuento."
                />
              )}
            </form.Field>
          </CardContent>
        </Card>
      )}

      {isBuyGet && (
        <Card>
          <CardHeader>
            <CardTitle>Compra X, obtén Y</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="grid max-w-48 gap-1.5">
                <form.Field name="buy_rules_min_quantity">
                  {(field) => (
                    <div className="grid gap-1.5">
                      <Label htmlFor={field.name}>
                        Cantidad mínima de compra
                      </Label>
                      <Input
                        id={field.name}
                        type="number"
                        min={1}
                        step={1}
                        value={field.state.value}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                      {(field.state.meta.errors[0] ||
                        fieldError("buy_rules_min_quantity")) && (
                        <p className="text-xs text-destructive">
                          {field.state.meta.errors[0] ||
                            fieldError("buy_rules_min_quantity")}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>
              </div>
              <form.Field name="buy_rules">
                {(field) => (
                  <RuleSetEditor
                    context="line"
                    rules={field.state.value}
                    onChange={field.handleChange}
                    description="Qué debe haber en el carrito para desbloquear la promoción."
                  />
                )}
              </form.Field>
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="grid max-w-48 gap-1.5">
                <form.Field name="apply_to_quantity">
                  {(field) => (
                    <div className="grid gap-1.5">
                      <Label htmlFor={field.name}>
                        Cantidad de artículos obtenidos
                      </Label>
                      <Input
                        id={field.name}
                        type="number"
                        min={1}
                        step={1}
                        value={field.state.value}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                      {(field.state.meta.errors[0] ||
                        fieldError("apply_to_quantity")) && (
                        <p className="text-xs text-destructive">
                          {field.state.meta.errors[0] ||
                            fieldError("apply_to_quantity")}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>
              </div>
              <form.Field name="target_rules">
                {(field) => (
                  <RuleSetEditor
                    context="line"
                    rules={field.state.value}
                    onChange={field.handleChange}
                    description="Artículos del carrito que reciben el beneficio."
                  />
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>
      )}

      {fieldError("form") && (
        <p role="alert" className="text-sm text-destructive">
          {fieldError("form")}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear promoción"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
