import { createFileRoute } from "@tanstack/react-router";

import { ProfileSettingsCard } from "@/components/features/profile/profile-settings-card";
import { useAuthStore } from "@/lib/auth/use-auth-store";
import type { UserResponse } from "@/lib/api/schemas";

export const Route = createFileRoute("/_layout/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const actor = useAuthStore((state) => state.actor);

  if (!actor) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          No se pudo cargar el perfil.
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col p-6 md:p-10">
      <nav aria-label="breadcrumb">
        <p className="text-sm text-muted-foreground">Usuario / Settings</p>
      </nav>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
        Información Personal
      </h1>
      <div className="mt-4 flex justify-center">
        <ProfileSettingsCard user={actor as UserResponse} />
      </div>
    </main>
  );
}
