import { Fragment, useState } from "react";
import { ChevronRight, Search } from "lucide-react";

import { CreateStateLocalityDialog } from "./create-state-locality-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type StateRowProps = {
  state: State;
  expanded: boolean;
  onToggle: () => void;
};

function StateRow({ state, expanded, onToggle }: StateRowProps) {
  return (
    <Fragment>
      <TableRow className="cursor-pointer" onClick={onToggle}>
        <TableCell className="font-medium">
          <span className="flex items-center gap-2">
            <ChevronRight
              className={`size-4 text-muted-foreground transition-transform ${
                expanded ? "rotate-90" : ""
              }`}
              aria-hidden="true"
            />
            {state.display_name}
          </span>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {dateFormatter.format(new Date(state.created_at))}
        </TableCell>
        <TableCell className="w-12">
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
              onToggle();
            }}
          >
            <ChevronRight
              className={`size-4 transition-transform ${
                expanded ? "rotate-90" : ""
              }`}
              aria-hidden="true"
            />
          </Button>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={3} className="bg-muted/40">
            <LocalitiesTable stateId={state.id} />
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
}

export function AddressCatalog() {
  const [expandedStateId, setExpandedStateId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { data, isLoading, mutate } = useListStatesRequest();

  const states = data?.status === 200 ? (data.data ?? []) : [];
  const error =
    data && data.status !== 200
      ? "No se pudieron cargar los estados. Revisa tu conexión e intenta nuevamente."
      : null;

  const query = search.trim().toLowerCase();
  const filteredStates = query
    ? states.filter((state) => state.display_name.toLowerCase().includes(query))
    : states;

  function handleToggle(stateId: string) {
    setExpandedStateId((current) => (current === stateId ? null : stateId));
  }

  return (
    <section
      aria-label="Catálogo de ubicaciones"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Catálogo de ubicaciones
          </h1>
        </div>
        <CreateStateLocalityDialog onSuccess={() => mutate()} />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="state-search">Búsqueda</Label>
            <div className="relative">
              <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                id="state-search"
                aria-label="Buscar estados"
                placeholder="Buscar por nombre"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-72 pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">&nbsp;</span>
            <Button
              className="h-8"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setExpandedStateId(null);
              }}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3" aria-label="Cargando estados">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div role="alert" className="space-y-3 py-10 text-center">
              <p className="font-medium">No se pudieron cargar los estados.</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={() => mutate()}>
                Reintentar
              </Button>
            </div>
          ) : filteredStates.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {search
                ? "No encontramos estados para esta búsqueda."
                : "No hay estados registrados."}
            </p>
          ) : (
            <Table aria-label="Listado de estados">
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creación</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStates.map((state) => (
                  <StateRow
                    key={state.id}
                    state={state}
                    expanded={expandedStateId === state.id}
                    onToggle={() => handleToggle(state.id)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
