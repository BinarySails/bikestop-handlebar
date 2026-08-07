import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { z } from "zod";

import { UserEditForm } from "@/components/features/users/user-edit-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetUserRequest, useListRolesHandler } from "@/lib/api/api";
import { UserViewParam } from "@/lib/api/schemas";

export const Route = createFileRoute("/_layout/users/$userId")({
  validateSearch: z.object({
    roles: z.array(z.string()).catch([]),
  }),
  component: UserDetailPage,
});

function UserDetailPage() {
  const { userId } = Route.useParams();
  const { roles: selectedRoleIds } = Route.useSearch();
  const navigate = useNavigate();
  const userQuery = useGetUserRequest(userId);
  const rolesQuery = useListRolesHandler();
  const user = userQuery.data?.status === 200 ? userQuery.data.data : undefined;
  const allRoles =
    rolesQuery.data?.status === 200 ? rolesQuery.data.data.roles : [];
  const selectedRoles = allRoles.filter((role) =>
    selectedRoleIds.includes(role.id)
  );
  const isClient = selectedRoles.some((role) => role.slug === "client");
  const editableRoles = allRoles.filter(
    (role) => role.slug !== "client" && role.status === "active"
  );

  const usersSearch = { view: UserViewParam.staff, limit: 20, offset: 0 };
  const goBack = () => navigate({ to: "/users", search: usersSearch });

  if (userQuery.isLoading || rolesQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[32rem] w-full rounded-xl" />
      </main>
    );
  }

  if (
    !user ||
    userQuery.error ||
    rolesQuery.error ||
    (rolesQuery.data && rolesQuery.data.status !== 200)
  ) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">No se pudo cargar el usuario</h1>
        <Button
          variant="outline"
          render={<Link to="/users" search={usersSearch} />}
        >
          Volver a usuarios
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <Button
          variant="outline"
          size="icon"
          aria-label="Volver a usuarios"
          render={<Link to="/users" search={usersSearch} />}
        >
          <ArrowLeftIcon />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isClient ? "Cliente" : "Usuario"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Consulta y actualiza la información de {user.name}.
          </p>
        </div>
      </div>

      <UserEditForm
        key={user.id}
        user={{ ...user, roles: selectedRoles }}
        roles={editableRoles}
        onCancel={goBack}
        onSaved={goBack}
      />
    </main>
  );
}
