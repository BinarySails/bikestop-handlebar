import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ClientsTableCard } from "@/components/features/clients/clients-table-card";

export const Route = createFileRoute("/admin/clients/")({
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.coerce.number().int().min(0).catch(0),
    limit: z.coerce.number().int().min(1).max(100).catch(20),
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <ClientsTableCard
      search={search.search}
      page={search.page}
      limit={search.limit}
      onParamsChange={(updates) =>
        navigate({
          search: (current) => ({ ...current, ...updates }),
          replace: true,
        })
      }
    />
  );
}
