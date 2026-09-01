import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { CustomerAddressFormDialog } from "@/components/features/customer/customer-address-form-dialog";
import { CustomerAddressList } from "@/components/features/customer/customer-address-list";
import { EntityCreateButton } from "@/components/features/entity/entity-create-button";
import { Button } from "@/components/ui/button";
import { useListCustomerAddressesRequest, useMeHandler } from "@/lib/api/api";
import { useAuthStore } from "@/lib/auth/use-auth-store";

export const Route = createFileRoute("/b2b/account")({
  component: AccountPage,
});

function AccountPage() {
  const actor = useAuthStore((state) => state.actor);
  // `actor` is null on a fresh SSR load (the /b2b auth guard is skipped during
  // SSR and beforeLoad does not re-run on hydration), so fall back to /auth/me.
  const { data: meRes } = useMeHandler();
  const userId = actor?.id ?? (meRes?.status === 200 ? meRes.data.id : "");

  const { data: addressesRes, mutate: mutateAddresses } =
    useListCustomerAddressesRequest(userId, {
      swr: { enabled: Boolean(userId) },
    });
  const addresses = addressesRes?.status === 200 ? addressesRes.data : [];

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

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Mis Direcciones
        </h1>
        <CustomerAddressFormDialog
          userId={userId}
          mode="create"
          onSuccess={() => mutateAddresses()}
          trigger={<EntityCreateButton>Agregar dirección</EntityCreateButton>}
        />
      </div>

      <div className="mt-4">
        <CustomerAddressList
          userId={userId}
          addresses={addresses}
          onChanged={() => mutateAddresses()}
        />
      </div>
    </div>
  );
}
