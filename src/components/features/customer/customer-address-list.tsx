import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CustomerAddressFormDialog } from "@/components/features/customer/customer-address-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useDeleteCustomerAddressRequest,
  useSetDefaultBillingAddressRequest,
  useSetDefaultShippingAddressRequest,
} from "@/lib/api/api";
import type { CustomerAddressWithAddressRow } from "@/lib/api/schemas";

function getErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;

  const error = data as { message?: unknown };
  if (typeof error.message !== "string" || !error.message.trim()) return fallback;

  const translations: Record<string, string> = {
    "address not found": "No se encontró la dirección",
    "cannot set an archived address as default":
      "No se puede marcar como predeterminada una dirección eliminada",
  };

  return translations[error.message.toLowerCase()] ?? error.message;
}

type CustomerAddressListProps = {
  userId: string;
  addresses: CustomerAddressWithAddressRow[];
  onChanged: () => void;
};

export function CustomerAddressList({
  userId,
  addresses,
  onChanged,
}: CustomerAddressListProps) {
  if (addresses.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Aún no tienes direcciones registradas.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {addresses.map((address) => (
        <CustomerAddressCard
          key={address.id}
          userId={userId}
          address={address}
          onChanged={onChanged}
        />
      ))}
    </div>
  );
}

function CustomerAddressCard({
  userId,
  address,
  onChanged,
}: {
  userId: string;
  address: CustomerAddressWithAddressRow;
  onChanged: () => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const { trigger: deleteAddress } = useDeleteCustomerAddressRequest(
    userId,
    address.id
  );
  const { trigger: setDefaultShipping } = useSetDefaultShippingAddressRequest(
    userId,
    address.id
  );
  const { trigger: setDefaultBilling } = useSetDefaultBillingAddressRequest(
    userId,
    address.id
  );

  async function handleDelete() {
    setPending(true);
    try {
      const result = await deleteAddress();
      if (result.status === 200) {
        toast.success("Dirección eliminada");
        setDeleteOpen(false);
        onChanged();
        return;
      }
      toast.error(getErrorMessage(result.data, "No se pudo eliminar la dirección"));
    } finally {
      setPending(false);
    }
  }

  async function handleSetDefaultShipping() {
    setPending(true);
    try {
      const result = await setDefaultShipping();
      if (result.status === 200) {
        toast.success("Dirección marcada como envío predeterminado");
        onChanged();
        return;
      }
      toast.error(
        getErrorMessage(result.data, "No se pudo marcar como predeterminada")
      );
    } finally {
      setPending(false);
    }
  }

  async function handleSetDefaultBilling() {
    setPending(true);
    try {
      const result = await setDefaultBilling();
      if (result.status === 200) {
        toast.success("Dirección marcada como facturación predeterminada");
        onChanged();
        return;
      }
      toast.error(
        getErrorMessage(result.data, "No se pudo marcar como predeterminada")
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            {address.contact_name}
          </p>
          <p className="text-sm text-muted-foreground">{address.phone}</p>
          <p className="mt-1 text-sm text-foreground">
            {address.street_address}, {address.city}, {address.state},{" "}
            {address.postal_code}, {address.country}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge
              className={cn(
                "cursor-pointer border-transparent disabled:cursor-default",
                pending && "opacity-60",
                address.is_default_shipping
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
              render={
                <button
                  type="button"
                  aria-label="Envío predeterminado"
                  onClick={handleSetDefaultShipping}
                  disabled={pending || address.is_default_shipping}
                />
              }
            >
              Envío predeterminado
            </Badge>
            <Badge
              className={cn(
                "cursor-pointer border-transparent disabled:cursor-default",
                pending && "opacity-60",
                address.is_default_billing
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
              render={
                <button
                  type="button"
                  aria-label="Facturación predeterminada"
                  onClick={handleSetDefaultBilling}
                  disabled={pending || address.is_default_billing}
                />
              }
            >
              Facturación predeterminada
            </Badge>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <CustomerAddressFormDialog
            userId={userId}
            mode="edit"
            address={address}
            onSuccess={onChanged}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Editar dirección"
              >
                <Pencil className="size-4" aria-hidden="true" />
              </Button>
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Eliminar dirección"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar dirección</DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres eliminar esta dirección? Podrás agregar una
              nueva más adelante.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={pending}
            >
              {pending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
