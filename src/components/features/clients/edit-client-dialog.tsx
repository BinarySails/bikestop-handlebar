import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import {
  useGetCustomerRequest,
  useUpdateCustomerRequest,
} from "@/lib/api/api";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditClientDialogProps {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function EditClientDialog({
  customerId,
  open,
  onOpenChange,
  onUpdated,
}: EditClientDialogProps) {
  const { data: customerRes, isLoading } = useGetCustomerRequest(customerId, {
    swr: { enabled: open },
  });
  const { trigger: updateCustomer, isMutating } =
    useUpdateCustomerRequest(customerId);

  const customer =
    customerRes?.status === 200 ? customerRes.data : undefined;

  const form = useForm({
    defaultValues: {
      companyName: "",
      taxId: "",
      phone: "",
      email: "",
    },
    onSubmit: async ({ value }) => {
      const result = await updateCustomer({
        company_name: value.companyName || null,
        tax_id: value.taxId || null,
        phone: value.phone || null,
        email: value.email || null,
      });

      if (result.status === 200) {
        toast.success("Cliente actualizado.");
        onOpenChange(false);
        onUpdated();
      } else {
        toast.error("Error al actualizar el cliente.");
      }
    },
  });

  useEffect(() => {
    if (customer && open) {
      form.setFieldValue("companyName", customer.company_name);
      form.setFieldValue("taxId", customer.tax_id ?? "");
      form.setFieldValue("phone", customer.phone ?? "");
      form.setFieldValue("email", customer.email ?? "");
    }
  }, [customer, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Actualiza la información del cliente.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">
              Cargando información...
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <form.Field
              name="companyName"
              validators={{
                onChange: ({ value }) => {
                  if (!value.trim()) return "El nombre de empresa es requerido";
                  if (value.trim().length < 3)
                    return "Debe tener al menos 3 caracteres";
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Nombre de Empresa</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Mi Empresa SA de CV"
                    aria-invalid={
                      field.state.meta.isTouched &&
                      field.state.meta.errors.length > 0
                        ? "true"
                        : undefined
                    }
                  />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-red-500">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="taxId">
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>RFC (opcional)</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="XAXX010101000"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="phone">
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Teléfono (opcional)</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="5555555555"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="email">
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Email (opcional)</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="empresa@example.com"
                  />
                </div>
              )}
            </form.Field>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>

              <form.Subscribe selector={(state) => [state.isSubmitting]}>
                {([isSubmitting]) => (
                  <Button type="submit" disabled={isSubmitting || isMutating}>
                    {isSubmitting || isMutating
                      ? "Guardando..."
                      : "Guardar Cambios"}
                  </Button>
                )}
              </form.Subscribe>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
