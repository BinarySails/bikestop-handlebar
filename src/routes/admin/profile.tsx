import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import {
  ProfileSettingsCard,
  type ProfileField,
} from "@/components/features/profile/profile-settings-card";
import { useUpdateUserProfileRequest, useMeHandler } from "@/lib/api/api";
import { useAuthStore } from "@/lib/auth/use-auth-store";
import type { UpdateUserProfileRequest, UserResponse } from "@/lib/api/schemas";

export const Route = createFileRoute("/admin/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const actor = useAuthStore((state) => state.actor);
  const userId = actor?.id ?? "";
  const { data: res, error, isLoading } = useMeHandler();
  const { trigger } = useUpdateUserProfileRequest(userId);
  const [user, setUser] = useState<UserResponse | null>(
    res?.status === 200 ? res.data : null
  );

  async function handleUpdateField(field: ProfileField, value: string) {
    const payload: UpdateUserProfileRequest = { [field]: value };
    const result = await trigger(payload);

    if (result.status === 200) {
      setUser(result.data);
      toast.success("Información actualizada.");
      return;
    }

    const message =
      result.data && "message" in result.data
        ? (result.data.message ?? "Error al actualizar la información.")
        : "Error al actualizar la información.";
    toast.error(message);
    throw new Error(message);
  }

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Cargando perfil...</p>
      </main>
    );
  }

  if (error || !user) {
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
        <ProfileSettingsCard user={user} onUpdateField={handleUpdateField} />
      </div>
    </main>
  );
}
