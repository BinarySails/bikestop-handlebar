/* oxlint-disable react/no-unstable-nested-components -- column cells are render callbacks, not components */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Eye,
  MapPin,
  MoreVertical,
  SearchIcon,
  WarehouseIcon,
} from "lucide-react";

import { SiteHeader } from "@/components/features/layout/site-header";
import { EntityCardTitle } from "@/components/features/entity/entity-card-title";
import {
  EntityIndexPage,
  type EntityColumn,
} from "@/components/features/entity/entity-index-page";
import { CreateWarehouseDialog } from "@/components/features/warehouses/create-warehouse-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
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
  enable: "Activo",
  disable: "Inactivo",
  archive: "Archivado",
};

const statusBadgeVariant: Record<WarehouseStatus, "default" | "secondary"> = {
  enable: "default",
  disable: "secondary",
  archive: "secondary",
};

const statusLabel: Record<WarehouseStatus, string> = {
  enable: "Activo",
  disable: "Inactivo",
  archive: "Archivado",
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

  const { data, isLoading, isValidating, mutate } = useListWarehousesRequest(
    statusFilter === "all" ? undefined : { status: statusFilter }
  );

  const warehouses = data?.status === 200 ? (data.data ?? []) : [];
  const hasError = Boolean(data && data.status !== 200);

  const query = search.trim().toLowerCase();
  const filteredWarehouses = query
    ? warehouses.filter((warehouse) => matchesSearch(warehouse, query))
    : warehouses;

  const columns: EntityColumn<WarehouseResponse>[] = [
    {
      header: "Estatus",
      cell: (warehouse) => (
        <Badge variant={statusBadgeVariant[warehouse.status]}>
          {statusLabel[warehouse.status]}
        </Badge>
      ),
    },
    {
      header: "Nombre",
      cell: (warehouse) => (
        <span className="font-medium">{warehouse.name}</span>
      ),
    },
    {
      header: "Código",
      cell: (warehouse) => (
        <span className="font-mono text-sm">{warehouse.code ?? "—"}</span>
      ),
    },
    {
      header: "Ciudad",
      cell: (warehouse) => (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden="true" />
          {warehouse.address.city}
        </span>
      ),
    },
    {
      header: <span className="sr-only">Acciones</span>,
      className: "w-12",
      cell: (warehouse) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`Acciones de ${warehouse.name}`}
              >
                <MoreVertical className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              render={
                <Link
                  to="/warehouses/$warehouseId"
                  params={{ warehouseId: warehouse.id }}
                />
              }
            >
              <Eye /> Ver detalle
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <SiteHeader
        title="Almacenes"
        description="Administra los almacenes, sus ubicaciones y el inventario en BikeStop."
        actions={<CreateWarehouseDialog onSuccess={() => mutate()} />}
      />
      <EntityIndexPage<WarehouseResponse>
        ariaLabel="Almacenes"
        cardTitle={
          <EntityCardTitle icon={WarehouseIcon}>
            Directorio de almacenes
          </EntityCardTitle>
        }
        cardHeaderExtras={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <InputGroup className="w-full max-w-xl">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, ciudad o código"
                aria-label="Buscar por nombre, ciudad o código"
              />
            </InputGroup>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Estatus</span>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as StatusFilter)
                }
              >
                <SelectTrigger size="sm" className="min-w-36">
                  <SelectValue>{statusFilterLabel[statusFilter]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="enable">Activo</SelectItem>
                  <SelectItem value="disable">Inactivo</SelectItem>
                  <SelectItem value="enable">Activo</SelectItem>
                  <SelectItem value="disable">Inactivo</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              >
                Limpiar
              </Button>
            </div>
          </div>
        }
        columns={columns}
        rows={filteredWarehouses}
        rowKey={(warehouse) => warehouse.id}
        loading={isLoading}
        validating={isValidating && !!data}
        hasError={hasError}
        errorMessage="No se pudieron cargar los almacenes. Revisa tu conexión e intenta nuevamente."
        onRetry={() => mutate()}
        emptyMessage="No hay almacenes que coincidan con los filtros."
      />
    </>
  );
}
