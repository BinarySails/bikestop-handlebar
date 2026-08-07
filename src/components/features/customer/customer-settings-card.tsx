import { useState } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Customer } from "@/lib/api/schemas";

export type CustomerField = "company_name" | "tax_id" | "phone" | "email";

interface CustomerSettingsCardProps {
  customer: Customer;
  onUpdateField: (field: CustomerField, value: string) => Promise<void>;
  disabled?: boolean;
}

const fieldRows: {
  field: CustomerField;
  label: string;
  placeholder: string;
  required: boolean;
  inputType?: string;
}[] = [
  {
    field: "company_name",
    label: "Nombre de la empresa",
    placeholder: "Nombre de tu empresa",
    required: true,
  },
  {
    field: "tax_id",
    label: "RFC",
    placeholder: "RFC de la empresa",
    required: true,
  },
  {
    field: "phone",
    label: "Teléfono",
    placeholder: "Ej. 5512345678",
    required: false,
  },
  {
    field: "email",
    label: "Correo Electrónico",
    placeholder: "tu@correo.com",
    required: false,
    inputType: "email",
  },
];

export function CustomerSettingsCard({
  customer,
  onUpdateField,
  disabled = false,
}: CustomerSettingsCardProps) {
  return (
    <div className="flex w-full max-w-5xl flex-col gap-3">
      {fieldRows.map((row) => (
        <CustomerFieldCard
          key={row.field}
          label={row.label}
          value={customer[row.field] ?? ""}
          placeholder={row.placeholder}
          required={row.required}
          inputType={row.inputType}
          disabled={disabled}
          onSave={(value) => onUpdateField(row.field, value)}
        />
      ))}
    </div>
  );
}

function CustomerFieldCard({
  label,
  value,
  placeholder,
  required,
  inputType,
  disabled,
  onSave,
}: {
  label: string;
  value: string;
  placeholder?: string;
  required: boolean;
  inputType?: string;
  disabled?: boolean;
  onSave: (value: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = `customer-${label.replace(/\s+/g, "-").toLowerCase()}`;

  function startEdit() {
    setDraft(value);
    setError(null);
    setEditing(true);
  }

  function validate(): string | null {
    const trimmed = draft.trim();
    if (required && !trimmed) return "Este campo es requerido";
    if (required && trimmed.length < 3)
      return "Debe tener al menos 3 caracteres";
    if (label === "Correo Electrónico") {
      if (!trimmed) return null;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return "Correo inválido";
      }
    }
    if (label === "Teléfono") {
      if (!trimmed) return null;
      if (trimmed.length < 10 || trimmed.length > 15) {
        return "El número debe tener entre 10 y 15 dígitos";
      }
    }
    return null;
  }

  async function handleSave() {
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    const trimmed = draft.trim();
    if (trimmed === value) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch {
      // error already surfaced by the parent
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-muted-foreground"
          >
            {label}
          </label>
        ) : (
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
        )}

        {editing ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Cancelar"
              disabled={saving}
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              size="icon"
              className="size-7"
              aria-label="Guardar"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="size-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="shrink-0 rounded-lg"
            onClick={startEdit}
            disabled={disabled}
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Modificar
          </Button>
        )}
      </div>

      {editing ? (
        <Input
          id={inputId}
          type={inputType ?? "text"}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSave();
            }
            if (event.key === "Escape") {
              setEditing(false);
              setError(null);
            }
          }}
          className="mt-2"
          aria-invalid={error ? "true" : undefined}
        />
      ) : (
        <p className="mt-2 text-sm text-foreground">{value || "—"}</p>
      )}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
