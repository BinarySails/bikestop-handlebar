import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/ventas")({ component: VentasPage })

function VentasPage() {
  return <section aria-label="Ventas" />
}
