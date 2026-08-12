import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const DEFAULT_COUNTRY = "México";

export function CountrySelect({
  id,
  value,
  onValueChange,
  disabled,
  "aria-invalid": ariaInvalid,
}: {
  id?: string;
  value?: string;
  onValueChange?: (value: string | null) => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
}) {
  return (
    <Select
      value={value ?? null}
      onValueChange={(next) => onValueChange?.(next)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full" aria-invalid={ariaInvalid}>
        <SelectValue placeholder="Seleccionar país" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={DEFAULT_COUNTRY}>{DEFAULT_COUNTRY}</SelectItem>
      </SelectContent>
    </Select>
  );
}
