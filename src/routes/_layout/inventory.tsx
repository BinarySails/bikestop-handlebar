import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/inventory")({
  component: InventoryPage,
})

function InventoryPage() {
  return <section aria-label="Inventario" />
}
