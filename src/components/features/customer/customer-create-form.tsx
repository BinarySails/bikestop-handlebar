import { useState } from "react";
import { useForm } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type CustomerFormValues = {
  company_name: string;
  tax_id: string;
  phone: string;
  email: string;
};

type CustomerCreateFormProps = {
  onSubmit: (values: CustomerFormValues) => Promise<string | null>;
};

function validateRequired(value: string, label: string): string | undefined {
  if (!value.trim()) return `El ${label} es obligatorio.`;
  if (value.trim().length < 3)
    return `El ${label} debe tener al menos 3 caracteres.`;
  return undefined;
}

function validatePhone(value: string): string | undefined {
  if (!value.trim()) return undefined;
  const trimmed = value.trim();
  if (trimmed.length < 10 || trimmed.length > 15)
    return "El teléfono debe tener entre 10 y 15 dígitos.";
  return undefined;
}

function validateEmail(value: string): string | undefined {
  if (!value.trim()) return undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return "Ingresa un correo válido.";
  }
  return undefined;
}

export function CustomerCreateForm({ onSubmit }: CustomerCreateFormProps) {
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const form = useForm({
    defaultValues: {
      company_name: "",
      tax_id: "",
      phone: "",
      email: "",
    },
    onSubmit: async ({ value }) => {
      setSubmissionError(null);
      const error = await onSubmit({
        company_name: value.company_name.trim(),
        tax_id: value.tax_id.trim(),
        phone: value.phone.trim(),
        email: value.email.trim(),
      });
      if (error) {
        setSubmissionError(error);
      }
    },
  });

  return (
    <form
      className="w-full max-w-lg space-y-4 rounded-2xl border bg-white p-6 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="company_name"
        validators={{
          onBlur: ({ value }) => validateRequired(value, "nombre"),
          onSubmit: ({ value }) => validateRequired(value, "nombre"),
        }}
      >
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Nombre de la empresa</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Nombre de tu empresa"
              aria-invalid={Boolean(field.state.meta.errors[0])}
              aria-describedby={`${field.name}-error`}
            />
            {field.state.meta.errors[0] && (
              <p
                id={`${field.name}-error`}
                className="text-sm text-destructive"
              >
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field
        name="tax_id"
        validators={{
          onBlur: ({ value }) => validateRequired(value, "RFC"),
          onSubmit: ({ value }) => validateRequired(value, "RFC"),
        }}
      >
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>RFC</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="RFC de la empresa"
              aria-invalid={Boolean(field.state.meta.errors[0])}
              aria-describedby={`${field.name}-error`}
            />
            {field.state.meta.errors[0] && (
              <p
                id={`${field.name}-error`}
                className="text-sm text-destructive"
              >
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field
        name="phone"
        validators={{
          onBlur: ({ value }) => validatePhone(value),
          onSubmit: ({ value }) => validatePhone(value),
        }}
      >
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Teléfono</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Ej. 5512345678"
              aria-invalid={Boolean(field.state.meta.errors[0])}
              aria-describedby={`${field.name}-error`}
            />
            {field.state.meta.errors[0] && (
              <p
                id={`${field.name}-error`}
                className="text-sm text-destructive"
              >
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field
        name="email"
        validators={{
          onBlur: ({ value }) => validateEmail(value),
          onSubmit: ({ value }) => validateEmail(value),
        }}
      >
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Correo Electrónico</Label>
            <Input
              id={field.name}
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="tu@correo.com"
              aria-invalid={Boolean(field.state.meta.errors[0])}
              aria-describedby={`${field.name}-error`}
            />
            {field.state.meta.errors[0] && (
              <p
                id={`${field.name}-error`}
                className="text-sm text-destructive"
              >
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {submissionError && (
        <p role="alert" className="text-sm text-destructive">
          {submissionError}
        </p>
      )}

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creando..." : "Crear perfil"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
