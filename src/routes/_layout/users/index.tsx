import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { UsersTableCard } from "@/components/features/users/users-table-card";
import {
  SortOrderParam,
  UserSortByParam,
  UserViewParam,
} from "@/lib/api/schemas";

export const Route = createFileRoute("/_layout/users/")({
  validateSearch: z.object({
    view: z.enum(UserViewParam).catch(UserViewParam.staff),
    search: z.string().optional(),
    role: z.uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).catch(20),
    offset: z.coerce.number().int().min(0).catch(0),
    sort_by: z.enum(UserSortByParam).optional(),
    sort_order: z.enum(SortOrderParam).optional(),
  }),
  component: UsersPage,
});

function UsersPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <section
      aria-label="Usuarios"
      className="mx-auto w-full max-w-7xl p-4 sm:p-6"
    >
      <UsersTableCard
        params={search}
        onParamsChange={(updates) =>
          navigate({
            search: (current) => ({ ...current, ...updates }),
            replace: true,
          })
        }
      />
    </section>
  );
}
