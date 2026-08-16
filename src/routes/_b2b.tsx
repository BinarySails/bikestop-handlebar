import { createFileRoute, Outlet } from "@tanstack/react-router";

import { B2BLayout } from "@/components/features/layout/b2b-layout";

export const Route = createFileRoute("/_b2b")({
  component: B2BLayoutRoute,
});

function B2BLayoutRoute() {
  return (
    <B2BLayout>
      <Outlet />
    </B2BLayout>
  );
}
