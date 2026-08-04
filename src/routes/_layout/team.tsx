import { createFileRoute } from "@tanstack/react-router";

import { UsersTableCard } from "@/components/features/users/users-table-card";

export const Route = createFileRoute("/_layout/team")({ component: TeamPage });

function TeamPage() {
  return (
    <section aria-label="Equipo" className="p-4 md:p-6">
      <UsersTableCard />
    </section>
  );
}
