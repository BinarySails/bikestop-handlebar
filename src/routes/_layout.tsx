import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppFooter } from "@/components/features/layout/app-footer";
import { AppHeader } from "@/components/features/layout/app-header";
import { AppSidebar } from "@/components/features/layout/app-sidebar";
import { requireAuth } from "@/lib/auth/require-auth";

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
    <div className="flex h-svh flex-col overflow-hidden bg-muted/20">
      <AppHeader />
      <div className="flex min-h-0 flex-1">
        <AppSidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <AppFooter />
    </div>
  );
}
