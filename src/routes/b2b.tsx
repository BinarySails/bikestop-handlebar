import { createFileRoute, Outlet } from "@tanstack/react-router";

import { B2BLayout } from "@/components/features/layout/b2b-layout";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { requireAuth, requirePolicy } from "@/lib/auth/require-auth";

export const Route = createFileRoute("/b2b")({
  beforeLoad: async ({ location }) => {
    await requireAuth({ location, navigateTo: "/login" });
    await requirePolicy(PERMISSIONS.b2bShop, {
      from: location.href,
      navigateTo: "/login",
    });
  },
  pendingComponent: () => (
    <div className="flex h-screen items-center justify-center">
      <p className="text-lg text-muted-foreground">Loading...</p>
    </div>
  ),
  component: B2BLayoutRoute,
});

function B2BLayoutRoute() {
  return (
    <B2BLayout>
      <Outlet />
    </B2BLayout>
  );
}
