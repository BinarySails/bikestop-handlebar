import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/equipo")({ component: EquipoPage })

function EquipoPage() {
  return <section aria-label="Equipo" />
}
