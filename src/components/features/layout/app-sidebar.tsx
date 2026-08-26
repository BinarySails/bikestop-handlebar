import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  BadgePercent,
  Shapes,
  ShoppingCart,
  Tags,
  UserRound,
  Users,
  Warehouse,
  Shield,
  EllipsisVerticalIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutHandler } from "@/lib/api/api";
import { useAuthStore } from "@/lib/auth/use-auth-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navigationItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Productos", icon: Package, to: "/products" },
  { label: "Ventas", icon: ShoppingCart, to: "/sales" },
  { label: "Inventario", icon: Package, to: "/inventory" },
  { label: "Categorías", icon: Shapes, to: "/categories" },
  { label: "Marcas", icon: Tags, to: "/brands" },
  { label: "Promociones", icon: BadgePercent, to: "/promotions" },
  { label: "Locaciones", icon: MapPin, to: "/locations" },
  { label: "Usuarios", icon: Users, to: "/users" },
  { label: "Roles", icon: Shield, to: "/roles" },
  { label: "Almacenes", icon: Warehouse, to: "/warehouses" },
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
  const displayEmail = actor?.email ?? "usuario@bikestop.com";
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
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="group-data-[collapsible=icon]:hidden">
        <a
          href="/"
          className="flex items-center gap-2 overflow-hidden rounded-lg p-2 outline-none group-data-[collapsible=icon]:justify-center focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label="BikeStop, ir al inicio"
        >
          <span className="text-lg font-semibold tracking-tight">
            Bike<span className="text-muted-foreground">Stop</span>
          </span>
        </a>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map(({ label, icon: Icon, to }) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton
                    render={<Link to={to} />}
                    isActive={pathname === to}
                    tooltip={label}
                  >
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg grayscale">
                      <AvatarFallback className="rounded-lg">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {displayName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {displayEmail}
                      </span>
                    </div>
                    <EllipsisVerticalIcon className="ml-auto size-4" />
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent align="start" side="top" className="w-52">
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                  <UserRound className="size-4" aria-hidden="true" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut className="size-4" aria-hidden="true" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
