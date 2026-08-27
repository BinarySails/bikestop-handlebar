import { createFileRoute, Outlet } from "@tanstack/react-router";

import { B2BLayout } from "@/components/features/layout/b2b-layout";
import { requireAuth } from "@/lib/auth/require-auth";

export const Route = createFileRoute("/b2b")({
  beforeLoad: async ({ location }) => {
    await requireAuth({ location, navigateTo: "/login" });
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
