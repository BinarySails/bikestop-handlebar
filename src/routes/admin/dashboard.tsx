import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { Dashboard } from "@/components/features/dashboard/dashboard";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const dashboardSearchSchema = z
  .object({
    from: z.string().regex(datePattern).optional().catch(undefined),
    to: z.string().regex(datePattern).optional().catch(undefined),
  })
  .transform((range) =>
    range.from && range.to && range.from <= range.to ? range : {}
  );

export const Route = createFileRoute("/admin/dashboard")({
  validateSearch: dashboardSearchSchema,
  component: DashboardPage,
});

function DashboardPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <Dashboard
      from={search.from}
      to={search.to}
      onRangeChange={(range) =>
        navigate({
          search: range,
          replace: true,
        })
      }
    />
  );
}
