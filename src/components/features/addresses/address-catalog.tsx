/* oxlint-disable react/no-unstable-nested-components -- column cells are render callbacks, not components */
import { useState } from "react";
import { ChevronRight, MapPin, RotateCcw, SearchIcon } from "lucide-react";

import { EntityCardTitle } from "@/components/features/entity/entity-card-title";
import {
  EntityIndexPage,
  type EntityColumn,
} from "@/components/features/entity/entity-index-page";
import { CreateStateLocalityDialog } from "./create-state-locality-modal";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListLocalitiesRequest, useListStatesRequest } from "@/lib/api/api";
import type { State } from "@/lib/api/schemas";

const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });

function LocalitiesTable({ stateId }: { stateId: string }) {
  const { data, isLoading, error, mutate } = useListLocalitiesRequest(stateId);

  const localities = data?.status === 200 ? (data.data.data ?? []) : [];

  if (isLoading) {
    return (
      <div className="space-y-2" aria-label="Cargando localidades">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="space-y-2 py-4 text-center">
        <p className="text-sm">No se pudieron cargar las localidades.</p>
        <Button variant="outline" size="sm" onClick={() => mutate()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (localities.length === 0) {
    return (
      <p className="py-2 text-sm text-muted-foreground">
        Este estado no tiene localidades registradas.
      </p>
    );
  }

  return (
    <Table aria-label="Localidades del estado">
      <TableHeader>
        <TableRow>
          <TableHead>Localidad</TableHead>
          <TableHead>Creación</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {localities.map((locality) => (
          <TableRow key={locality.id}>
            <TableCell className="font-medium">
              {locality.display_name}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {dateFormatter.format(new Date(locality.created_at))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function AddressCatalog() {
  const [expandedStateId, setExpandedStateId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { data, isLoading, mutate } = useListStatesRequest();

  const states = data?.status === 200 ? (data.data ?? []) : [];
  const hasError = Boolean(data && data.status !== 200);

  const query = search.trim().toLowerCase();
  const filteredStates = query
    ? states.filter((state) => state.display_name.toLowerCase().includes(query))
    : states;

  function handleToggle(stateId: string) {
    setExpandedStateId((current) => (current === stateId ? null : stateId));
  }

  function handleClearFilters() {
    setSearch("");
    setExpandedStateId(null);
  }

  const columns: EntityColumn<State>[] = [
    {
      header: "Estado",
      cell: (state) => {
        const expanded = expandedStateId === state.id;
        return (
          <span className="font-medium">
            <span className="flex items-center gap-2">
              <ChevronRight
                className={`size-4 text-muted-foreground transition-transform ${
                  expanded ? "rotate-90" : ""
                }`}
                aria-hidden="true"
              />
              {state.display_name}
            </span>
          </span>
        );
      },
    },
    {
      header: "Creación",
      cell: (state) => (
        <span className="text-muted-foreground">
          {dateFormatter.format(new Date(state.created_at))}
        </span>
      ),
    },
    {
      header: <span className="sr-only">Acciones</span>,
      className: "w-12",
      cell: (state) => {
        const expanded = expandedStateId === state.id;
        return (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={
              expanded
                ? `Ocultar localidades de ${state.display_name}`
                : `Ver localidades de ${state.display_name}`
            }
            aria-expanded={expanded}
            onClick={(event) => {
              event.stopPropagation();
              handleToggle(state.id);
            }}
          >
            <ChevronRight
              className={`size-4 transition-transform ${
                expanded ? "rotate-90" : ""
              }`}
              aria-hidden="true"
            />
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <EntityIndexPage<State>
        ariaLabel="Catálogo de ubicaciones"
        title="Catálogo de ubicaciones"
        description="Administra los estados y localidades del catálogo de ubicaciones en BikeStop."
        headerActions={<CreateStateLocalityDialog onSuccess={() => mutate()} />}
        cardTitle={
          <EntityCardTitle icon={MapPin}>Estados y localidades</EntityCardTitle>
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
                placeholder="Buscar por nombre"
                aria-label="Buscar estados"
              />
            </InputGroup>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={handleClearFilters}
            >
              <RotateCcw />
              Limpiar
            </Button>
          </div>
        }
        columns={columns}
        rows={filteredStates}
        rowKey={(state) => state.id}
        onRowClick={(state) => handleToggle(state.id)}
        expandedRowKey={expandedStateId}
        expandedRowContent={(state) => <LocalitiesTable stateId={state.id} />}
        loading={isLoading}
        hasError={hasError}
        errorMessage="No se pudieron cargar los estados. Revisa tu conexión e intenta nuevamente."
        onRetry={() => mutate()}
        emptyMessage={
          search
            ? "No encontramos estados para esta búsqueda."
            : "No hay estados registrados."
        }
      />
    </>
  );
}
