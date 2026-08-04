import { useState } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserResponse } from "@/lib/api/schemas";

export type ProfileField = "name" | "father_last_name" | "email" | "phone";

interface ProfileSettingsCardProps {
  user: UserResponse;
  onUpdateField: (field: ProfileField, value: string) => Promise<void>;
}

const fieldRows: {
  field: ProfileField;
  label: string;
  placeholder: string;
  inputType?: string;
}[] = [
  { field: "name", label: "Nombre", placeholder: "Tu nombre" },
  { field: "father_last_name", label: "Apellido", placeholder: "Tu apellido" },
  {
    field: "email",
    label: "Correo Electrónico",
    placeholder: "tu@correo.com",
    inputType: "email",
  },
  {
    field: "phone",
    label: "Número de Celular",
    placeholder: "Ej. 5512345678",
  },
];

export function ProfileSettingsCard({
  user,
  onUpdateField,
}: ProfileSettingsCardProps) {
  return (
    <div className="flex w-full max-w-5xl flex-col gap-3">
      {fieldRows.map((row) => (
        <ProfileFieldCard
          key={row.field}
          label={row.label}
          value={user[row.field] ?? ""}
          placeholder={row.placeholder}
          inputType={row.inputType}
          onSave={(value) => onUpdateField(row.field, value)}
        />
      ))}
    </div>
  );
}

function ProfileFieldCard({
  label,
  value,
  placeholder,
  inputType,
  onSave,
}: {
  label: string;
  value: string;
  placeholder?: string;
  inputType?: string;
  onSave: (value: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = `profile-${label.replace(/\s+/g, "-").toLowerCase()}`;

  function startEdit() {
    setDraft(value);
    setError(null);
    setEditing(true);
  }

  function validate(): string | null {
    const trimmed = draft.trim();
    if (label === "Nombre" || label === "Apellido") {
      if (!trimmed) return "Este campo es requerido";
      if (trimmed.length < 3) return "Debe tener al menos 3 caracteres";
    }
    if (label === "Correo Electrónico") {
      if (!trimmed) return "Este campo es requerido";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return "Correo inválido";
      }
    }
    if (label === "Número de Celular" && trimmed && trimmed.length < 10) {
      return "El número debe tener al menos 10 dígitos";
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
