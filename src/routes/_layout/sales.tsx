import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/sales")({
  component: SalesPage,
});

function SalesPage() {
  return <section aria-label="Ventas" />;
}
