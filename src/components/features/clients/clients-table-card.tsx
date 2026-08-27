/* oxlint-disable react/no-unstable-nested-components -- column cells are render callbacks, not components */
import { useEffect, useState } from "react";
import { SearchIcon, ContactIcon, MoreVerticalIcon } from "lucide-react";

import { CreateClientDialog } from "@/components/features/clients/create-client-modal";
import { AssignUserDialog } from "@/components/features/clients/assign-user-dialog";
import { SiteHeader } from "@/components/features/layout/site-header";
import { EntityCardTitle } from "@/components/features/entity/entity-card-title";
import {
  EntityIndexPage,
  type EntityColumn,
} from "@/components/features/entity/entity-index-page";
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
import { useListCustomersRequest } from "@/lib/api/api";
import type { PaginatedCustomerSummaryDataItem } from "@/lib/api/schemas";

type ClientsTableCardProps = {
  search: string | undefined;
  page: number;
  limit: number;
  onParamsChange: (updates: {
    search?: string;
    page?: number;
    limit?: number;
  }) => void;
};

export function ClientsTableCard({
  search,
  page,
  limit,
  onParamsChange,
}: ClientsTableCardProps) {
  const [searchInput, setSearchInput] = useState(search ?? "");
  const [assignCustomerId, setAssignCustomerId] = useState<string | null>(null);

  const query = useListCustomersRequest(
    {
      search: search?.trim() || undefined,
      page,
      limit,
    },
    { swr: { keepPreviousData: true } }
  );

  useEffect(() => setSearchInput(search ?? ""), [search]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextSearch = searchInput.trim() || undefined;
      if (nextSearch !== search)
        onParamsChange({ search: nextSearch, page: 0 });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [onParamsChange, search, searchInput]);

  const response = query.data?.status === 200 ? query.data.data : undefined;
  const clients = response?.data ?? [];
  const total = response?.total ?? 0;
  const currentPage = response?.page ?? page ?? 0;
  const invalidResponse = query.data && query.data.status !== 200;
  const hasError = Boolean(query.error || invalidResponse);

  const assignCustomer = assignCustomerId
    ? (clients.find((c) => c.id === assignCustomerId) ?? null)
    : null;

  const columns: EntityColumn<PaginatedCustomerSummaryDataItem>[] = [
    {
      header: "Empresa",
      className: "w-56 pl-5",
      cell: (client) => (
        <span className="block font-semibold">{client.company_name}</span>
      ),
    },
    {
      header: "RFC",
      className: "w-40",
      cell: (client) => (
        <span className="text-gray-600">{client.tax_id ?? "—"}</span>
      ),
    },
    {
      header: "Email",
      className: "w-64",
      cell: (client) => (
        <span className="text-gray-600">{client.email ?? "—"}</span>
      ),
    },
    {
      header: "Usuario",
      className: "w-40",
      cell: (client) =>
        client.username ? (
          <span className="text-gray-600">{client.username}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Sin usuario</span>
        ),
    },
    {
      header: <span className="sr-only">Acciones</span>,
      className: "w-16 text-center",
      cell: (client) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Acciones de ${client.company_name}`}
              />
            }
          >
            <MoreVerticalIcon className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!client.username && (
              <DropdownMenuItem onClick={() => setAssignCustomerId(client.id)}>
                Asignar usuario
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const emptyMessage = search
    ? "No hay clientes que coincidan con los filtros."
    : "No se encontraron clientes.";

  return (
    <>
      {assignCustomer && (
        <AssignUserDialog
          customer={assignCustomer}
          open={assignCustomerId !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setAssignCustomerId(null);
          }}
          onAssigned={() => {
            setAssignCustomerId(null);
            query.mutate();
          }}
        />
      )}

      <SiteHeader
        title="Clientes"
        description="Administra los clientes de BikeStop."
        actions={<CreateClientDialog onCreated={() => query.mutate()} />}
      />
      <EntityIndexPage<PaginatedCustomerSummaryDataItem>
        ariaLabel="Clientes"
        cardTitle={
          <EntityCardTitle icon={ContactIcon}>
            Directorio de clientes
          </EntityCardTitle>
        }
        cardHeaderExtras={
          <InputGroup className="w-full max-w-xl">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar por empresa, RFC, email o usuario"
              aria-label="Buscar por empresa, RFC, email o usuario"
            />
          </InputGroup>
        }
        columns={columns}
        rows={clients}
        rowKey={(client) => client.id}
        loading={query.isLoading && !response}
        validating={query.isValidating && !!response}
        hasError={hasError}
        errorMessage="No fue posible cargar los clientes."
        onRetry={() => query.mutate()}
        emptyMessage={emptyMessage}
        pagination={{
          mode: "page",
          total,
          page: currentPage,
          pageSize: limit,
          onPageSizeChange: (nextLimit) =>
            onParamsChange({ limit: nextLimit, page: 0 }),
          onPageChange: (nextPage) => onParamsChange({ page: nextPage }),
        }}
      />
    </>
  );
}
