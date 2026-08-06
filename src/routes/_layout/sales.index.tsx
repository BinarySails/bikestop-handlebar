import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/sales/")({
  component: SalesListPage,
});

function SalesListPage() {
  return <section aria-label="Listado de pedidos" />;
}
