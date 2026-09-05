import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { CustomerAddressFormDialog } from "@/components/features/customer/customer-address-form-dialog";
import { CustomerAddressList } from "@/components/features/customer/customer-address-list";
import { EntityCreateButton } from "@/components/features/entity/entity-create-button";
import {
  ProfileSettingsCard,
  type ProfileField,
} from "@/components/features/profile/profile-settings-card";
import { Button } from "@/components/ui/button";
import {
  useListCustomerAddressesRequest,
  useMeHandler,
  useUpdateUserProfileRequest,
} from "@/lib/api/api";
import { useAuthStore } from "@/lib/auth/use-auth-store";
import type { UpdateUserProfileRequest, UserResponse } from "@/lib/api/schemas";

export const Route = createFileRoute("/b2b/account")({
  component: AccountPage,
});

function AccountPage() {
  const actor = useAuthStore((state) => state.actor);
  // `actor` is null on a fresh SSR load (the /b2b auth guard is skipped during
  // SSR and beforeLoad does not re-run on hydration), so fall back to /auth/me.
  const { data: meRes } = useMeHandler();
  const userId = actor?.id ?? (meRes?.status === 200 ? meRes.data.id : "");

  const [user, setUser] = useState<UserResponse | null>(null);
  useEffect(() => {
    if (meRes?.status === 200) setUser(meRes.data);
  }, [meRes]);

  const { trigger: updateProfile } = useUpdateUserProfileRequest(userId);

  const { data: addressesRes, mutate: mutateAddresses } =
    useListCustomerAddressesRequest(userId, {
      swr: { enabled: Boolean(userId) },
    });
  const addresses = addressesRes?.status === 200 ? addressesRes.data : [];

  async function handleUpdateProfileField(field: ProfileField, value: string) {
    const payload: UpdateUserProfileRequest = { [field]: value };
    const result = await updateProfile(payload);

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

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col p-4 py-6 sm:px-6">
      <Button
        render={<Link to="/" />}
        nativeButton={false}
        variant="ghost"
        size="sm"
        className="mb-2 -ml-2 self-start"
      >
        <ArrowLeft />
        Volver al catálogo
      </Button>

      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Mi Perfil
      </h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-foreground">
          Información personal
        </h2>
        <div className="mt-3">
          {user ? (
            <ProfileSettingsCard
              user={user}
              onUpdateField={handleUpdateProfileField}
            />
          ) : (
            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Cargando información...
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            Mis Direcciones
          </h2>
          <CustomerAddressFormDialog
            userId={userId}
            mode="create"
            onSuccess={() => mutateAddresses()}
            trigger={<EntityCreateButton>Agregar dirección</EntityCreateButton>}
          />
        </div>

        <div className="mt-3">
          <CustomerAddressList
            userId={userId}
            addresses={addresses}
            onChanged={() => mutateAddresses()}
          />
        </div>
      </section>
    </div>
  );
}
