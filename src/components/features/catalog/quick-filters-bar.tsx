import { Sparkles } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function QuickFiltersBar() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Sparkles className="size-4 text-muted-foreground" />

      <Select disabled>
        <SelectTrigger className="h-8 w-auto rounded-full px-3 text-xs">
          <SelectValue placeholder="Tipo de producto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" label="Todos">
            Todos
          </SelectItem>
        </SelectContent>
      </Select>

      <Select disabled>
        <SelectTrigger className="h-8 w-auto rounded-full px-3 text-xs">
          <SelectValue placeholder="Conectividad" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" label="Todos">
            Todos
          </SelectItem>
        </SelectContent>
      </Select>

      <Select disabled>
        <SelectTrigger className="h-8 w-auto rounded-full px-3 text-xs">
          <SelectValue placeholder="Instalación" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" label="Todos">
            Todos
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
