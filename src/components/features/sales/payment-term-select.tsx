import { useMemo } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListPaymentTermsRequest } from "@/lib/api/api";
import type { PaymentTerm } from "@/lib/api/schemas";

const EMPTY_TERMS: PaymentTerm[] = [];

export function PaymentTermSelect({
  id,
  value,
  onChange,
  disabled,
  "aria-invalid": ariaInvalid,
}: {
  id?: string;
  value: PaymentTerm | null;
  onChange: (id: PaymentTerm | null) => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
}) {
  const { data, isLoading } = useListPaymentTermsRequest();

  const terms = useMemo<PaymentTerm[]>(() => {
    const all = data?.status === 200 ? data.data : EMPTY_TERMS;
    return all.filter((term) => term.is_active);
  }, [data]);

  return (
    <Select
      value={value ?? null}
      onValueChange={(next) => onChange(next ?? null)}
      disabled={disabled}
      itemToStringLabel={(next) => next.name}
    >
      <SelectTrigger id={id} className="w-full" aria-invalid={ariaInvalid}>
        <SelectValue
          placeholder={
            isLoading ? "Cargando términos..." : "Seleccionar término"
          }
        />
      </SelectTrigger>
      <SelectContent>
        {terms.length === 0 && !isLoading ? (
          <SelectItem value="__empty__" disabled>
            Sin términos disponibles
          </SelectItem>
        ) : null}
        {terms.map((term) => (
          <SelectItem key={term.id} value={term} label={term.name}>
            {term.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
