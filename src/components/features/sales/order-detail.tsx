import { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, MapPin, Package } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { SalesOrderStatus } from "@/lib/api/schemas";

export type OrderProduct = {
  id: string;
  imageUrl?: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type OrderDetailData = {
  folio: string;
  status: SalesOrderStatus;
  products: OrderProduct[];
  customer: {
    id: string;
    name: string;
    rfc?: string;
    email?: string;
    avatarUrl?: string;
  };
  shipping: {
    carrier: string;
    address: string;
    estimatedDelivery: string;
  };
  discount: number;
  taxRate: number;
  subtotal?: number;
  taxTotal?: number;
  grandTotal?: number;
  notes?: string;
  payments: Array<{
    method: string;
    reference: string;
    status: "Pagado" | "Pendiente" | "Rechazado";
    amount: number;
  }>;
  invoices: Array<{ folio: string; status: string }>;
};

type OrderDetailProps = {
  order: OrderDetailData;
  availableCarriers?: string[];
  onBack?: () => void;
  onOpenPaymentsAndInvoices?: (order: OrderDetailData) => void;
  onDispatch?: (order: OrderDetailData) => void | Promise<void>;
  onCancel?: (order: OrderDetailData) => void | Promise<void>;
  onSave?: (order: OrderDetailData) => void | Promise<void>;
};

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

export function OrderDetail({
  order,
  availableCarriers = [],
  onBack,
  onOpenPaymentsAndInvoices,
  onDispatch,
  onCancel,
  onSave,
}: OrderDetailProps) {
  const [draft, setDraft] = useState(order);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "dispatch" | "cancel" | null
  >(null);

  const totals = useMemo(() => {
    const subtotal =
      draft.subtotal ??
      draft.products.reduce(
        (sum, product) => sum + product.quantity * product.unitPrice,
        0
      );
    const taxableAmount = Math.max(0, subtotal - draft.discount);
    const taxes = draft.taxTotal ?? taxableAmount * draft.taxRate;
    const total = draft.grandTotal ?? taxableAmount + taxes;
    return { subtotal, taxes, total };
  }, [
    draft.products,
    draft.discount,
    draft.taxRate,
    draft.subtotal,
    draft.taxTotal,
    draft.grandTotal,
  ]);

  async function saveDraft(message = "Cambios guardados") {
    await onSave?.(draft);
    toast.success(message);
  }

  const isQuote = draft.status === "quote";

  async function dispatchOrder() {
    setPendingAction("dispatch");
    try {
      await onDispatch?.(draft);
      toast.success(`Pedido ${draft.folio} marcado como despachado`);
    } finally {
      setPendingAction(null);
    }
  }

  async function cancelOrder() {
    setPendingAction("cancel");
    try {
      await onCancel?.(draft);
      setCancelOpen(false);
      toast.success(`Pedido ${draft.folio} cancelado`);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <main className="w-full p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="rounded-full"
          aria-label="Volver al listado de pedidos"
          onClick={onBack}
        >
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {isQuote ? "COTIZACIÓN" : "PEDIDO"} #{draft.folio}
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            Estado: {draft.status.replaceAll("_", " ")}
          </p>
        </div>
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="products-title">
            <h2 id="products-title" className="mb-4 text-lg font-bold">
              Productos
            </h2>
            <div className="overflow-hidden rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Imagen</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="min-w-52">Producto</TableHead>
                    <TableHead className="w-28 text-center">Cantidad</TableHead>
                    <TableHead className="text-right">
                      Precio Unitario
                    </TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {draft.products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex size-14 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <Package className="size-6 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {product.sku}
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-block min-w-6 font-medium tabular-nums">
                          {product.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {currencyFormatter.format(product.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {currencyFormatter.format(
                          product.quantity * product.unitPrice
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          {!isQuote && (
            <Button
              type="button"
              className="h-12 w-full rounded-none font-bold tracking-wide"
              onClick={() => onOpenPaymentsAndInvoices?.(draft)}
            >
              PAGOS Y FACTURAS
            </Button>
          )}

          <section aria-labelledby="notes-title">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 id="notes-title" className="text-lg font-bold">
                Notas y Observaciones
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => saveDraft("Notas guardadas")}
              >
                Guardar notas
              </Button>
            </div>
            <Textarea
              value={draft.notes ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder="Agregar notas o observaciones especiales...."
              className="min-h-32 resize-y"
            />
          </section>

          <div
            className={
              isQuote
                ? "grid"
                : "grid grid-cols-[minmax(0,2fr)_minmax(180px,1fr)] gap-4"
            }
          >
            {!isQuote && (
              <Button
                type="button"
                size="lg"
                className="h-12 font-bold"
                disabled={pendingAction !== null}
                onClick={dispatchOrder}
              >
                {pendingAction === "dispatch" ? "DESPACHANDO..." : "DESPACHAR"}
              </Button>
            )}
            <Button
              type="button"
              variant="destructive"
              size="lg"
              className="h-12 bg-destructive font-bold text-white hover:bg-destructive/90"
              disabled={pendingAction !== null}
              onClick={() => setCancelOpen(true)}
            >
              CANCELAR PEDIDO
            </Button>
          </div>
        </div>

        <aside
          className="space-y-3 xl:sticky xl:top-4 xl:self-start"
          aria-label="Información del pedido"
        >
          <Card size="sm">
            <CardHeader>
              <CardTitle>Información del cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex items-center gap-3">
                <Avatar className="size-11">
                  <AvatarImage src={draft.customer.avatarUrl} alt="" />
                  <AvatarFallback>
                    {initials(draft.customer.name)}
                  </AvatarFallback>
                </Avatar>
                <p className="font-bold uppercase">{draft.customer.name}</p>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-sm">
                <dt className="font-semibold">ID:</dt>
                <dd className="break-all text-muted-foreground">
                  {draft.customer.id}
                </dd>
                {draft.customer.rfc && (
                  <>
                    <dt className="font-semibold">RFC:</dt>
                    <dd className="break-all text-muted-foreground">
                      {draft.customer.rfc}
                    </dd>
                  </>
                )}
                {draft.customer.email && (
                  <>
                    <dt className="font-semibold">Email:</dt>
                    <dd className="break-all text-muted-foreground">
                      {draft.customer.email}
                    </dd>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Detalles de envío</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="grid gap-1 text-sm font-semibold">
                <span>Paquetería</span>
                <Select
                  value={draft.shipping.carrier}
                  onValueChange={(carrier) => {
                    if (!carrier) return;
                    setDraft((current) => ({
                      ...current,
                      shipping: { ...current.shipping, carrier },
                    }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCarriers.map((carrier) => (
                      <SelectItem key={carrier} value={carrier}>
                        {carrier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1 text-sm">
                <span className="font-semibold">Dirección</span>
                <button
                  type="button"
                  className="flex min-h-8 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm hover:bg-muted"
                  onClick={() => toast.info(draft.shipping.address)}
                >
                  <MapPin className="size-4 shrink-0" />
                  <span className="line-clamp-1">{draft.shipping.address}</span>
                </button>
              </div>

              <label
                htmlFor="estimated-delivery"
                className="grid gap-1 text-sm font-semibold"
              >
                Fecha estimada de entrega
                <span className="relative">
                  <CalendarDays className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="estimated-delivery"
                    type="date"
                    value={draft.shipping.estimatedDelivery}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        shipping: {
                          ...current.shipping,
                          estimatedDelivery: event.target.value,
                        },
                      }))
                    }
                    className="pl-9"
                  />
                </span>
              </label>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Resumen del pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <SummaryRow label="Subtotal" value={totals.subtotal} />
              <SummaryRow label="Descuentos" value={-draft.discount} />
              <SummaryRow
                label={`Impuestos (${draft.taxRate * 100}% IVA)`}
                value={totals.taxes}
              />
              <Separator />
              <div className="flex items-center justify-between text-lg font-bold">
                <span>TOTAL</span>
                <span className="tabular-nums">
                  {currencyFormatter.format(totals.total)}
                </span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cancelar el pedido?</DialogTitle>
            <DialogDescription>
              Esta acción cancelará por completo el pedido #{draft.folio} y no
              se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={pendingAction === "cancel"}
            >
              Volver
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={cancelOrder}
              disabled={pendingAction === "cancel"}
            >
              {pendingAction === "cancel" ? "Cancelando..." : "Sí, cancelar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">
        {currencyFormatter.format(value)}
      </span>
    </div>
  );
}
