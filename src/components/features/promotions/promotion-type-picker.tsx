import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import { PROMOTION_TYPE_OPTIONS, type PromotionKind } from "./promotion-form";

type PromotionTypePickerProps = {
  value: PromotionKind | null;
  onChange: (kind: PromotionKind) => void;
};

export function PromotionTypePicker({
  value,
  onChange,
}: PromotionTypePickerProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {PROMOTION_TYPE_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "group relative flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              selected
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:bg-muted/50"
            )}
          >
            <span className="font-medium">{option.title}</span>
            <span className="text-sm text-muted-foreground">
              {option.description}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-3 right-3 grid size-5 place-items-center rounded-full border",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input text-transparent"
              )}
            >
              <Check className="size-3" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
