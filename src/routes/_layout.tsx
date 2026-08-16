import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppFooter } from "@/components/features/layout/app-footer";
import { AppSidebar } from "@/components/features/layout/app-sidebar";
import { requireAuth } from "@/lib/auth/require-auth";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_layout")({
  beforeLoad: async ({ location }) => {
    await requireAuth({ location, navigateTo: "/login" });
  },
  pendingComponent: () => (
    <div className="flex h-screen items-center justify-center">
      <p className="text-lg text-muted-foreground">Loading...</p>
    </div>
  ),
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <Outlet />
        </main>
        <AppFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
