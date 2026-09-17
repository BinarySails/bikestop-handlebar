import type {
  AddressSnapshot,
  SalesOrder,
  SalesOrderStatus,
} from "@/lib/api/schemas";
import { computeDueDate, formatDueDate } from "@/lib/dates";
import { centsToPesos } from "@/lib/money";

const statusLabel: Record<SalesOrderStatus, string> = {
  draft: "Borrador",
  quote: "Cotización",
  confirmed: "Confirmada",
  partially_fulfilled: "Parcialmente despachada",
  fulfilled: "Completamente despachada",
  cancelled: "Cancelada",
  closed: "Cerrada",
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "long" });

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function formatMoney(cents: number) {
  return currencyFormatter.format(centsToPesos(cents));
}

export function SalesOrderPrintDocument({ order }: { order: SalesOrder }) {
  const dueDate = computeDueDate(
    order.order_date,
    order.payment_term.days_until_due ?? null
  );
  const totalUnits = order.lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-lg font-bold tracking-tight">BikeStop</p>
          <p className="text-sm text-muted-foreground">Pedido de venta</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold tracking-tight">
            {order.order_number}
          </p>
          <p className="text-sm text-muted-foreground">
            {statusLabel[order.status]}
          </p>
          <p className="text-sm text-muted-foreground">
            {dateFormatter.format(new Date(order.order_date))}
          </p>
        </div>
      </header>

      <section className="grid gap-6 py-6 sm:grid-cols-2">
        <div>
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Cliente
          </h2>
          <p className="mt-1 font-medium">{order.customer.name}</p>
          <div className="mt-2 text-sm text-muted-foreground">
            <AddressLines address={order.billing_address} />
          </div>
        </div>
        <div>
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Dirección de envío
          </h2>
          <div className="mt-1 text-sm text-muted-foreground">
            <AddressLines address={order.shipping_address} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 border-y py-4 text-sm sm:grid-cols-4">
        <Meta label="Fecha del pedido">
          {dateFormatter.format(new Date(order.order_date))}
        </Meta>
        <Meta label="Término de pago">{order.payment_term.name}</Meta>
        {dueDate && <Meta label="Vence el">{formatDueDate(dueDate)}</Meta>}
        <Meta label="Unidades">{String(totalUnits)}</Meta>
      </section>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
            <th className="py-2 pr-2 font-semibold">#</th>
            <th className="py-2 pr-2 font-semibold">Descripción</th>
            <th className="py-2 pr-2 text-right font-semibold">Cant.</th>
            <th className="py-2 pr-2 text-right font-semibold">P. unitario</th>
            <th className="py-2 pr-2 text-right font-semibold">IVA</th>
            <th className="py-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line) => (
            <tr key={line.id} className="border-b align-top">
              <td className="py-2 pr-2 text-muted-foreground">
                {line.line_number}
              </td>
              <td className="py-2 pr-2">
                {line.description}
                {line.discount_amount > 0 && (
                  <span className="block text-xs text-muted-foreground">
                    Descuento: −{formatMoney(line.discount_amount)}
                  </span>
                )}
              </td>
              <td className="py-2 pr-2 text-right">{line.quantity}</td>
              <td className="py-2 pr-2 text-right">
                {formatMoney(line.unit_price)}
              </td>
              <td className="py-2 pr-2 text-right">{line.tax_rate / 100}%</td>
              <td className="py-2 text-right font-medium">
                {formatMoney(line.line_total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatMoney(order.subtotal)}</span>
          </div>
          {order.discount_total > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Descuento</span>
              <span>−{formatMoney(order.discount_total)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Impuestos</span>
            <span>{formatMoney(order.tax_total)}</span>
          </div>
          <div className="flex justify-between border-t pt-1 text-base font-semibold">
            <span>Total</span>
            <span>{formatMoney(order.grand_total)}</span>
          </div>
        </div>
      </div>

      {order.comments && (
        <section className="mt-6 border-t pt-4">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Comentarios
          </h2>
          <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">
            {order.comments}
          </p>
        </section>
      )}

      <footer className="mt-8 border-t pt-4 text-xs text-muted-foreground">
        Documento generado desde BikeStop el {dateFormatter.format(new Date())}.
      </footer>
    </>
  );
}

function AddressLines({ address }: { address: AddressSnapshot }) {
  return (
    <div className="space-y-0.5">
      <p>{address.address}</p>
      <p>
        {address.city}, {address.state}
      </p>
      <p>{address.postal_code}</p>
      <p>{address.country}</p>
    </div>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{children}</p>
    </div>
  );
}
