import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Building2,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  Tags,
  UserRound,
  Users,
  Warehouse,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutHandler } from "@/lib/api/api";
import { useAuthStore } from "@/lib/auth/use-auth-store";
import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Productos", icon: Package, to: "/products" },
  { label: "Ventas", icon: ShoppingCart, to: "/sales" },
  { label: "Inventario", icon: Package, to: "/inventory" },
  { label: "Categorías", icon: Tags, to: "/categories" },
  { label: "Marcas", icon: Tag, to: "/brands" },
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
  const navigate = useNavigate();
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

  async function handleLogout() {
    try {
      await logoutHandler();
    } catch {
      // clear the local session regardless of the server response
    }
    useAuthStore.getState().clearAuth();
    navigate({ to: "/login" });
  }

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
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 w-full justify-center px-2 md:justify-start md:px-3"
                  aria-label="Configuración"
                >
                  <Settings className="size-4" aria-hidden="true" />
                  <span className="hidden md:inline">Configuración</span>
                </Button>
              }
            />
            <DropdownMenuContent align="start" side="top" className="w-52">
              <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                <UserRound className="size-4" aria-hidden="true" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/customer" })}>
                <Building2 className="size-4" aria-hidden="true" />
                Cliente
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOut className="size-4" aria-hidden="true" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
