import { AddressCatalog } from "@/components/features/addresses/address-catalog";
import { createFileRoute } from "@tanstack/react-router";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { requirePolicy } from "@/lib/auth/require-auth";

export const Route = createFileRoute("/admin/locations")({
  beforeLoad: async ({ location }) => {
    await requirePolicy(PERMISSIONS.locationView, {
      from: location.href,
      navigateTo: "/login",
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <AddressCatalog />;
}
