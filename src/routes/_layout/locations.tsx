import { AddressCatalog } from "@/components/features/addresses/address-catalog";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/locations")({
  component: RouteComponent,
});

function RouteComponent() {
  return <AddressCatalog />;
}
