import { ChevronDown } from "lucide-react";

import { useListTagsRequest } from "@/lib/api/api";
import type { OrderTag, OrderTagId } from "@/lib/api/schemas";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

type OrderTagsSelectProps = {
  value: OrderTagId[];
  onChange: (ids: OrderTagId[]) => void;
  placeholder?: string;
  className?: string;
  activeOnly?: boolean;
  id?: string;
};

function tagSwatch(tag: OrderTag) {
  return (
    <span
      aria-hidden
      className="size-2.5 shrink-0 rounded-full"
      style={{
        backgroundColor: tag.color ?? undefined,
      }}
    />
  );
}

export function OrderTagsSelect({
  value,
  onChange,
  placeholder = "Etiquetas",
  className,
  activeOnly = false,
  id,
}: OrderTagsSelectProps) {
  const { data, isLoading } = useListTagsRequest(
    activeOnly ? { status: "active" } : undefined
  );
  const tags = data?.status === 200 ? data.data.tags : [];

  const selectedTags = tags.filter((tag) => value.includes(tag.id));
  const label =
    selectedTags.length > 0
      ? selectedTags.map((tag) => tag.display_name).join(", ")
      : placeholder;

  function toggleTag(tag: OrderTagId) {
    onChange(
      value.includes(tag)
        ? value.filter((item) => item !== tag)
        : [...value, tag]
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        id={id}
        render={
          <Button
            variant="outline"
            type="button"
            className={`w-full justify-between font-normal ${className ?? ""}`}
          >
            <span className="flex min-w-0 items-center gap-1.5 truncate">
              {selectedTags.length > 0 && (
                <span className="flex shrink-0 -space-x-1">
                  {selectedTags.slice(0, 3).map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full ring-2 ring-background"
                    >
                      {tagSwatch(tag)}
                    </span>
                  ))}
                </span>
              )}
              <span className="truncate">{label}</span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent className="w-64 p-2" align="start">
        {isLoading ? (
          <div className="space-y-2 p-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-6 w-full" />
            ))}
          </div>
        ) : tags.length === 0 ? (
          <p className="px-2 py-3 text-center text-sm text-muted-foreground">
            No hay etiquetas disponibles.
          </p>
        ) : (
          <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
            {tags.map((tag) => {
              const checked = value.includes(tag.id);
              return (
                <label
                  key={tag.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleTag(tag.id)}
                  />
                  {tagSwatch(tag)}
                  <span className="truncate">{tag.display_name}</span>
                </label>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
