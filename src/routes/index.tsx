import { createFileRoute } from "@tanstack/react-router";

import { B2BLayout } from "@/components/features/layout/b2b-layout";
import { CatalogPage } from "@/components/features/catalog/catalog-page";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <B2BLayout>
      <CatalogPage />
    </B2BLayout>
  );
}
