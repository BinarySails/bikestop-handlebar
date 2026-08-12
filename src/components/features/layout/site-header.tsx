import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

type SiteHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  backTo?: string;
  backLabel?: string;
  actions?: ReactNode;
};

export function SiteHeader({
  title,
  description,
  backTo,
  backLabel,
  actions,
}: SiteHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="" />
        {backTo && (
          <Button
            render={<Link to={backTo} />}
            variant="ghost"
            size="sm"
            aria-label={backLabel ?? "Volver"}
            className="-ml-1"
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Button>
        )}
        <div className="min-w-0">
          <h1 className="text-base font-medium">{title}</h1>
          {description && (
            <p className="truncate text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
