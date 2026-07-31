import { createFileRoute } from "@tanstack/react-router"

import { AddressCatalog } from "@/components/features/addresses/address-catalog"

export const Route = createFileRoute("/locations")({
  component: LocationsPage,
})

function LocationsPage() {
  return <AddressCatalog />
  return <section aria-label="Locaciones" />
}
