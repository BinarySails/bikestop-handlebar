import { Archive, CircleCheck, CirclePause } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Brand } from "@/lib/api/schemas";

const labels: Record<Brand["status"], string> = {
  enable: "Activa",
  disable: "Desactivada",
  archive: "Archivada",
};

export function BrandStatusBadge({ status }: { status: Brand["status"] }) {
  const Icon =
    status === "enable"
      ? CircleCheck
      : status === "disable"
        ? CirclePause
        : Archive;
  const variant =
    status === "enable"
      ? "default"
      : status === "archive"
        ? "destructive"
        : "secondary";

  return (
    <Badge variant={variant}>
      <Icon className="size-3" aria-hidden="true" />
      {labels[status]}
    </Badge>
  );
}

export const brandStatusLabel = labels;
