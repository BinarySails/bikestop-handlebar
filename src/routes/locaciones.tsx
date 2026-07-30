import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/locaciones")({
  component: LocacionesPage,
})

function LocacionesPage() {
  return <section aria-label="Locaciones" />
}
