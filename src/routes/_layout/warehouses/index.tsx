import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";

import { CreateWarehouseDialog } from "@/components/features/warehouses/create-warehouse-modal";
import { WarehousesTable } from "@/components/features/warehouses/warehouses-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListWarehousesRequest } from "@/lib/api/api";
import type { WarehouseResponse, WarehouseStatus } from "@/lib/api/schemas";

export const Route = createFileRoute("/_layout/warehouses/")({
  component: WarehousesIndexPage,
});

type StatusFilter = "all" | WarehouseStatus;

const statusFilterLabel: Record<StatusFilter, string> = {
  all: "Todos",
  active: "Activo",
  inactive: "Inactivo",
};

function matchesSearch(warehouse: WarehouseResponse, query: string) {
  return (
    warehouse.name.toLowerCase().includes(query) ||
    warehouse.address.city.toLowerCase().includes(query) ||
    (warehouse.code ?? "").toLowerCase().includes(query)
  );
}

function WarehousesIndexPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, mutate } = useListWarehousesRequest(
    statusFilter === "all" ? undefined : { status: statusFilter }
  );

  const warehouses = data?.status === 200 ? (data.data ?? []) : [];
  const error =
    data && data.status !== 200
      ? "No se pudieron cargar los almacenes. Revisa tu conexión e intenta nuevamente."
      : null;

  const query = search.trim().toLowerCase();
  const filteredWarehouses = query
    ? warehouses.filter((warehouse) => matchesSearch(warehouse, query))
    : warehouses;

  return (
    <section
      aria-label="Almacenes"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Almacenes</h1>
        </div>
        <CreateWarehouseDialog onSuccess={() => mutate()} />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="warehouse-search">Búsqueda</Label>
            <div className="relative">
              <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                id="warehouse-search"
                placeholder="Nombre, ciudad o código"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-72 pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="warehouse-status">Estatus</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger id="warehouse-status" className="w-44">
                <SelectValue
                  placeholder="Seleccionar"
                  render={() => <span>{statusFilterLabel[statusFilter]}</span>}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">&nbsp;</span>
            <Button
              className="h-8"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <WarehousesTable
            warehouses={filteredWarehouses}
            loading={isLoading}
            error={error}
            onRetry={() => mutate()}
          />
        </CardContent>
      </Card>
    </section>
  );
}
