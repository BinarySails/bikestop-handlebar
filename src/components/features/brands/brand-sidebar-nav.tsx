import { Link } from "@tanstack/react-router";
import { Globe, Info, Mail, MapPin, Tags } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const sections = [
  { label: "Información", icon: Info, anchor: "information" },
  { label: "Sitio web", icon: Globe, anchor: "web" },
  { label: "Contacto", icon: Mail, anchor: "contacts" },
  { label: "Dirección", icon: MapPin, anchor: "address" },
  { label: "Marcas", icon: Tags, anchor: "brands" },
] as const;

export function BrandSidebarNav() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r">
      <div className="flex flex-col gap-1 p-4">
        <Button
          render={<Link to={"/brands" as never} />}
          variant="ghost"
          size="sm"
          className="justify-start"
        >
          ← Marcas
        </Button>
        <span className="text-sm font-semibold">Todas las marcas</span>
      </div>

      <Separator />

      <nav
        className="flex flex-col gap-1 p-3"
        aria-label="Secciones de la marca"
      >
        {sections.map(({ label, icon: Icon, anchor }) => {
          return (
            <Button
              key={anchor}
              variant="ghost"
              size="sm"
              className={cn("justify-start gap-2")}
              onClick={() => {
                document
                  .getElementById(anchor)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              aria-label={label}
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
