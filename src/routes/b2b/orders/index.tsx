import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useListMySalesOrdersRequest } from "@/lib/api/api";
import { centsToPesos } from "@/lib/money";
import type { SalesOrderStatus } from "@/lib/api/schemas";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const statusLabel: Record<SalesOrderStatus, string> = {
  draft: "Borrador",
  quote: "Cotización",
  confirmed: "Confirmada",
  partially_fulfilled: "Parcialmente",
  fulfilled: "Completamente",
  cancelled: "Cancelada",
  closed: "Cerrada",
};

const statusBadgeVariant: Record<
  SalesOrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  quote: "outline",
  confirmed: "default",
  partially_fulfilled: "default",
  fulfilled: "default",
  cancelled: "destructive",
  closed: "secondary",
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
});

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function generatePaginationPages(
  currentPage: number,
  totalPages: number
): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pages: (number | "ellipsis")[] = [];
  pages.push(0);

  if (currentPage > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages - 2, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 4) {
    pages.push("ellipsis");
  }

  pages.push(totalPages - 1);

  return pages;
}

export const Route = createFileRoute("/b2b/orders/")({
  component: OrdersPage,
});

function OrdersPage() {
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  // `/sales-orders/me` scopes to the caller's customer via the session cookie,
  // so no user/customer id has to be resolved on the client. The endpoint
  // paginates from 0; `page` state is already 0-indexed.
  const { data: ordersRes, isLoading } = useListMySalesOrdersRequest({
    page,
    limit: PAGE_SIZE,
  });

  const orders = ordersRes?.status === 200 ? ordersRes.data.data : [];
  const total = ordersRes?.status === 200 ? ordersRes.data.total : 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

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
        Mis Pedidos
      </h1>

      <div className="mt-4">
        {isLoading ? (
          <div className="rounded-2xl border p-6 text-center text-sm text-muted-foreground">
            Cargando pedidos...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aún no tienes pedidos registrados.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                to="/b2b/orders/$orderId"
                params={{ orderId: order.id }}
                className="block"
              >
                <div className="rounded-2xl border bg-white p-4 shadow-sm transition-colors hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {order.order_number}
                        </p>
                        <Badge variant={statusBadgeVariant[order.status]}>
                          {statusLabel[order.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {dateFormatter.format(new Date(order.order_date))}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {currencyFormatter.format(
                        centsToPesos(order.grand_total)
                      )}
                    </p>
                  </div>
                </div>
              </Link>
            ))}

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setPage((prev) => Math.max(0, prev - 1));
                      }}
                      aria-disabled={page === 0}
                      className={
                        page === 0 ? "pointer-events-none opacity-50" : ""
                      }
                    />
                  </PaginationItem>
                  {generatePaginationPages(page, totalPages).map(
                    (item, index) =>
                      item === "ellipsis" ? (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={item}>
                          <PaginationLink
                            href="#"
                            onClick={(event) => {
                              event.preventDefault();
                              setPage(item);
                            }}
                            isActive={item === page}
                          >
                            {item + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setPage((prev) => Math.min(totalPages - 1, prev + 1));
                      }}
                      aria-disabled={page === totalPages - 1}
                      className={
                        page === totalPages - 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
