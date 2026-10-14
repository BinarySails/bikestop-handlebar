import { createFileRoute } from "@tanstack/react-router";

import { PromotionsCatalog } from "@/components/features/promotions/promotions-catalog";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { requirePolicy } from "@/lib/auth/require-auth";

export const Route = createFileRoute("/admin/promotions/")({
  beforeLoad: async ({ location }) => {
    await requirePolicy(PERMISSIONS.promotionView, {
      from: location.href,
      navigateTo: "/login",
    });
  },
  component: PromotionsPage,
});

function PromotionsPage() {
  return <PromotionsCatalog />;
}
