import { useState } from "react";
import { ChevronDown, Funnel, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { CountrySelect } from "@/components/features/locations/country-select";
import { StateSelect } from "@/components/features/locations/state-select";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FilterDefinition =
  | {
      key: string;
      label: string;
      type: "text";
      placeholder?: string;
      valueFormatter?: (value: string) => string;
    }
  | {
      key: string;
      label: string;
      type: "select";
      options: { value: string; label: string }[];
      valueFormatter?: (value: string) => string;
    }
  | {
      key: string;
      label: string;
      type: "date";
      valueFormatter?: (value: string) => string;
    }
  | {
      key: string;
      label: string;
      type: "state";
      valueFormatter?: (value: string) => string;
    }
  | {
      key: string;
      label: string;
      type: "country";
      valueFormatter?: (value: string) => string;
    }
  | {
      key: string;
      label: string;
      type: "number";
      placeholder?: string;
      valueFormatter?: (value: string) => string;
    };

export type EntityFilterBarProps = {
  filters: FilterDefinition[];
  values: Partial<Record<string, string>>;
  pinned: string[];
  onChange: (key: string, value: string | undefined) => void;
  onClear: () => void;
};

function displayValue(definition: FilterDefinition, value: string): string {
  return definition.valueFormatter ? definition.valueFormatter(value) : value;
}

function FilterEditor({
  definition,
  currentValue,
  onApply,
  onClose,
}: {
  definition: FilterDefinition;
  currentValue?: string;
  onApply: (value: string | undefined) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(currentValue ?? "");

  function commit() {
    onApply(draft.trim() === "" ? undefined : draft);
  }

  if (definition.type === "select") {
    return (
      <div className="flex flex-col gap-2.5">
        <Select
          value={draft || null}
          onValueChange={(value) => setDraft(value ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent>
            {definition.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={commit}>
            Aplicar
          </Button>
        </div>
      </div>
    );
  }

  if (definition.type === "date") {
    return (
      <div className="flex flex-col gap-2.5">
        <DatePicker
          value={draft ? new Date(draft) : undefined}
          onChange={(date) =>
            setDraft(date ? date.toISOString().split("T")[0] : "")
          }
          className="w-full"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={commit}>
            Aplicar
          </Button>
        </div>
      </div>
    );
  }

  if (definition.type === "state" || definition.type === "country") {
    const control =
      definition.type === "state" ? (
        <StateSelect
          value={draft || undefined}
          onValueChange={(value) => setDraft(value ?? "")}
        />
      ) : (
        <CountrySelect
          value={draft || undefined}
          onValueChange={(value) => setDraft(value ?? "")}
        />
      );

    return (
      <div className="flex flex-col gap-2.5">
        {control}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={commit}>
            Aplicar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <Input
        type={definition.type === "number" ? "number" : "text"}
        min={definition.type === "number" ? 0 : undefined}
        placeholder={definition.placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button size="sm" onClick={commit}>
          Aplicar
        </Button>
      </div>
    </div>
  );
}

function VisibleFilter({
  definition,
  value,
  onApply,
  onRemove,
}: {
  definition: FilterDefinition;
  value?: string;
  onApply: (value: string | undefined) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          value !== undefined ? (
            <Button variant="outline" size="sm" className="h-6 font-normal">
              <span className="flex min-w-0 items-center gap-1 rounded-4xl py-0.5 pr-1 pl-1.5 hover:bg-muted">
                <span className="shrink-0 text-muted-foreground">
                  {definition.label}
                </span>
                <span className="max-w-56 truncate font-medium">
                  {displayValue(definition, value)}
                </span>
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove();
                }}
                aria-label={`Quitar filtro ${definition.label}`}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="h-6 font-normal">
              <Funnel className="size-3.5" />
              {definition.label}
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
          )
        }
      />
      <PopoverContent align="start">
        <FilterEditor
          definition={definition}
          currentValue={value}
          onApply={(next) => {
            setOpen(false);
            onApply(next);
          }}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

function OverflowMenu({
  definitions,
  values,
  appliedCount,
  onApply,
}: {
  definitions: FilterDefinition[];
  values: Partial<Record<string, string>>;
  appliedCount: number;
  onApply: (key: string, value: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const available = definitions.filter(
    (definition) => values[definition.key] === undefined
  );
  const editing = definitions.find(
    (definition) => definition.key === editingKey
  );

  function handlePick(key: string) {
    setEditingKey(key);
  }

  function handleApply(key: string, value: string | undefined) {
    setOpen(false);
    setEditingKey(null);
    onApply(key, value);
  }

  function handleClose() {
    setOpen(false);
    setEditingKey(null);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setEditingKey(null);
      }}
    >
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="h-6 font-normal">
            <Funnel className="size-3.5" />
            Más
            {appliedCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                {appliedCount}
              </span>
            )}
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent className="w-64 p-1" align="start">
        {editing ? (
          <div className="p-1.5">
            <FilterEditor
              definition={editing}
              currentValue={values[editing.key]}
              onApply={(value) => handleApply(editing.key, value)}
              onClose={handleClose}
            />
          </div>
        ) : available.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            <p className="px-1.5 py-1 text-xs font-medium text-muted-foreground">
              Agregar filtro
            </p>
            {available.map((definition) => (
              <button
                key={definition.key}
                type="button"
                onClick={() => handlePick(definition.key)}
                className="flex items-center justify-between rounded-md px-1.5 py-1.5 text-left text-sm hover:bg-accent"
              >
                {definition.label}
                <ChevronDown className="size-3.5 -rotate-90 text-muted-foreground" />
              </button>
            ))}
          </div>
        ) : (
          <p className="px-1.5 py-1 text-sm text-muted-foreground">
            No hay más filtros por agregar.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function EntityFilterBar({
  filters,
  values,
  pinned,
  onChange,
  onClear,
}: EntityFilterBarProps) {
  const visible = filters.filter(
    (definition) =>
      pinned.includes(definition.key) || values[definition.key] !== undefined
  );
  const overflow = filters.filter(
    (definition) => !pinned.includes(definition.key)
  );
  const overflowApplied = overflow.filter(
    (definition) => values[definition.key] !== undefined
  );
  const applied = filters.filter(
    (definition) => values[definition.key] !== undefined
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible.map((definition) => (
        <VisibleFilter
          key={definition.key}
          definition={definition}
          value={values[definition.key]}
          onApply={(value) => onChange(definition.key, value)}
          onRemove={() => onChange(definition.key, undefined)}
        />
      ))}

      {overflow.length > 0 && (
        <OverflowMenu
          definitions={overflow}
          values={values}
          appliedCount={overflowApplied.length}
          onApply={onChange}
        />
      )}

      {applied.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 font-normal"
          onClick={onClear}
        >
          Limpiar
        </Button>
      )}
    </div>
  );
}
