import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListLocalitiesRequest } from "@/lib/api/api";
import type { StateId } from "@/lib/api/schemas";

export function LocalitySelect({
  id,
  stateId,
  value,
  onValueChange,
  disabled,
  "aria-invalid": ariaInvalid,
}: {
  id?: string;
  stateId?: StateId | null;
  value?: string;
  onValueChange?: (value: string | null) => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
}) {
  const { data: res, isLoading } = useListLocalitiesRequest(stateId ?? "", {
    swr: { enabled: Boolean(stateId) },
  });

  const localities = res?.status === 200 ? (res.data.data ?? []) : [];
  const isDisabled = disabled || !stateId || isLoading;

  return (
    <Select
      value={value ?? null}
      onValueChange={(next) => onValueChange?.(next)}
      disabled={isDisabled}
    >
      <SelectTrigger id={id} className="w-full" aria-invalid={ariaInvalid}>
        <SelectValue
          placeholder={
            !stateId
              ? "Selecciona un estado primero"
              : isLoading
                ? "Cargando ciudades..."
                : "Selecciona una ciudad"
          }
        />
      </SelectTrigger>
      <SelectContent>
        {localities.map((locality) => (
          <SelectItem key={locality.id} value={locality.display_name}>
            {locality.display_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
