import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Settings,
  ShoppingCart,
  Tags,
  UserRound,
  Users,
  Warehouse,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth/use-auth-store";
import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Productos", icon: Package, to: "/products" },
  { label: "Ventas", icon: ShoppingCart, to: "/sales" },
  { label: "Inventario", icon: Package, to: "/inventory" },
  { label: "Categorías", icon: Tags, to: "/categories" },
  { label: "Marcas", icon: Tags, to: "/brands" },
  { label: "Locaciones", icon: MapPin, to: "/locations" },
  { label: "Almacenes", icon: Warehouse, to: "/warehouses" },
  { label: "Equipo", icon: Users, to: "/team" },
] as const;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppSidebar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pathname = useLocation({ select: (location) => location.pathname });
  const actor = useAuthStore((state) => state.actor);

  const displayName =
    actor && "name" in actor && actor.name
      ? actor.name
      : (actor?.username ?? "Usuario");
  const displayEmail = actor?.email ?? "";
  const initials = getInitials(
    actor && "name" in actor && actor.name
      ? actor.name
      : (actor?.username ?? "U")
  );

  return (
    <aside className="flex w-20 shrink-0 flex-col border-r bg-background md:w-64">
      <nav
        className="flex flex-1 flex-col gap-1 p-3"
        aria-label="Navegación principal"
      >
        {navigationItems.map(({ label, icon: Icon, to }) => {
          const active = pathname === to;

          return (
            <Button
              key={label}
              render={<Link to={to} />}
              variant={active ? "secondary" : "ghost"}
              className={cn(
                "h-10 justify-center px-2 md:justify-start md:px-3",
                active && "font-semibold"
              )}
              aria-current={active ? "page" : undefined}
              aria-label={label}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="hidden md:inline">{label}</span>
            </Button>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="space-y-1">
          {settingsOpen && (
            <div id="sidebar-settings-menu" className="space-y-1">
              <Button
                type="button"
                variant="ghost"
                render={<Link to="/profile" />}
                className="h-10 w-full justify-center px-2 md:justify-start md:px-3"
                aria-label="Perfil"
                onClick={() => setSettingsOpen(false)}
              >
                <UserRound className="size-4" aria-hidden="true" />
                <span className="hidden md:inline">Perfil</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-10 w-full justify-center px-2 text-destructive hover:bg-destructive/10 hover:text-destructive md:justify-start md:px-3"
                aria-label="Cerrar sesión"
              >
                <LogOut className="size-4" aria-hidden="true" />
                <span className="hidden md:inline">Cerrar sesión</span>
              </Button>
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            className="h-10 w-full justify-center px-2 md:justify-start md:px-3"
            aria-expanded={settingsOpen}
            aria-controls="sidebar-settings-menu"
            aria-label="Configuración"
            onClick={() => setSettingsOpen((open) => !open)}
          >
            <Settings className="size-4" aria-hidden="true" />
            <span className="hidden md:inline">Configuración</span>
          </Button>
        </div>

        <div className="mt-2 flex items-center justify-center gap-2 rounded-md border-t pt-3 md:justify-start">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials}
          </span>
          <span className="hidden min-w-0 text-left md:block">
            <span className="block truncate text-sm leading-none font-medium">
              {displayName}
            </span>
            <span className="mt-1 block truncate text-xs leading-none text-muted-foreground">
              {displayEmail || "Perfil de usuario"}
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}
