import { createFileRoute } from "@tanstack/react-router";

import { PromotionsCatalog } from "@/components/features/promotions/promotions-catalog";

export const Route = createFileRoute("/_layout/promotions/")({
  component: PromotionsPage,
});

function PromotionsPage() {
  return <PromotionsCatalog />;
}
