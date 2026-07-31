import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/inventory")({
  component: InventoryPage,
})

function InventoryPage() {
  return <section aria-label="Inventario" />
}
