import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/inventario")({
  component: InventarioPage,
})

function InventarioPage() {
  return <section aria-label="Inventario" />
}
