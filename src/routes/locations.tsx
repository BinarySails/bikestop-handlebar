import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/locations")({
  component: LocationsPage,
})

function LocationsPage() {
  return <section aria-label="Locaciones" />
}
