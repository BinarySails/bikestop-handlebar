import { createFileRoute } from "@tanstack/react-router";

import { AddressCatalog } from "@/components/features/addresses/address-catalog";

export const Route = createFileRoute("/_layout/locations")({
  component: LocationsPage,
});

function LocationsPage() {
  return <AddressCatalog />;
}
