import { createFileRoute } from "@tanstack/react-router";

import { CatalogPage } from "@/components/features/catalog/catalog-page";

export const Route = createFileRoute("/b2b/")({
  component: HomePage,
});

function HomePage() {
  return <CatalogPage />;
}
