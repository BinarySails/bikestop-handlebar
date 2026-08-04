import { createFileRoute } from "@tanstack/react-router";

import { UsersTableCard } from "@/components/features/users/users-table-card";

export const Route = createFileRoute("/_layout/users")({
  component: UsersPage,
});

function UsersPage() {
  return (
    <section aria-label="Usuarios" className="p-4 md:p-6">
      <UsersTableCard />
    </section>
  );
}
