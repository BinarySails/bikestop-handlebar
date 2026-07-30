import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/sales")({ component: SalesPage })

function SalesPage() {
  return <section aria-label="Ventas" />
}
