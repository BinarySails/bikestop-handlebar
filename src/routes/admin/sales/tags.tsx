/* oxlint-disable react/no-unstable-nested-components -- column cells are render callbacks, not components */
import { useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  CircleCheck,
  CircleX,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  SearchIcon,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { deleteTagRequest, useListTagsRequest } from "@/lib/api/api";
import type { OrderTag, OrderTagStatus } from "@/lib/api/schemas";

import { EntityCardTitle } from "@/components/features/entity/entity-card-title";
import { EntityCreateButton } from "@/components/features/entity/entity-create-button";
import {
  EntityIndexPage,
  type EntityColumn,
} from "@/components/features/entity/entity-index-page";
import { SiteHeader } from "@/components/features/layout/site-header";
import { CreateSaleOrderTagDialog } from "@/components/features/sales/tags/create-sale-order-tag-dialog";
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

export const Route = createFileRoute("/admin/sales/tags")({
  component: TagsPage,
});

const PAGE_SIZE = 10;

type StatusFilter = "all" | OrderTagStatus;

const statusFilterLabel: Record<StatusFilter, string> = {
  all: "Todos",
  enable: "Activos",
  disable: "Inactivos",
  archive: "Archivado",
};

function TagsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<OrderTag | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading, mutate, error } = useListTagsRequest({
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const allTags = useMemo(
    () => (data?.status === 200 ? data.data.tags : []),
    [data]
  );

  const filteredTags = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allTags.filter((tag) => {
      if (query) {
        const matches =
          tag.display_name.toLowerCase().includes(query) ||
          tag.slug.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [allTags, search]);

  const paginatedTags = filteredTags.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  const handleCreate = () => {
    setEditingTag(undefined);
    setFormOpen(true);
  };

  const handleEdit = (tag: OrderTag) => {
    setEditingTag(tag);
    setFormOpen(true);
  };

  const handleDelete = async (tag: OrderTag) => {
    if (!confirm(`¿Eliminar etiqueta "${tag.display_name}"?`)) return;
    try {
      const result = await deleteTagRequest(tag.id);
      if (result.status !== 200) throw result;
      toast.success(`Etiqueta "${tag.display_name}" eliminada.`);
      mutate();
    } catch {
      toast.error("No se pudo eliminar la etiqueta.");
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingTag(undefined);
    mutate();
  };

  function handleStatusChange(value: StatusFilter | null) {
    setStatusFilter(value ?? "all");
    setPage(0);
  }

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("all");
    setPage(0);
  }

  const columns: EntityColumn<OrderTag>[] = [
    {
      header: "Color",
      cell: (tag) =>
        tag.color ? (
          <div className="flex items-center gap-2">
            <span
              className="size-4 rounded-full border"
              style={{ backgroundColor: tag.color }}
            />
            <span className="font-mono text-xs text-muted-foreground">
              {tag.color}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      header: "Nombre",
      cell: (tag) => <span className="font-medium">{tag.display_name}</span>,
    },
    {
      header: "Slug",
      cell: (tag) => (
        <span className="font-mono text-muted-foreground">{tag.slug}</span>
      ),
    },
    {
      header: "Estado",
      cell: (tag) => (
        <Badge
          variant={tag.status === "enable" ? "default" : "secondary"}
          className="gap-1"
        >
          {tag.status === "enable" ? (
            <CircleCheck className="size-3" />
          ) : (
            <CircleX className="size-3" />
          )}
          {tag.status === "enable" ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      header: <span className="sr-only">Acciones</span>,
      className: "w-12",
      cell: (tag) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(tag)}>
              <Pencil className="size-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => handleDelete(tag)}
            >
              <Trash2 className="size-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <SiteHeader
        title="Etiquetas"
        description="Administra las etiquetas de órdenes de venta."
        actions={
          <>
            <Button
              render={<Link to="/admin/sales" />}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              <ArrowLeft className="size-4" />
              Volver
            </Button>
            <EntityCreateButton onClick={handleCreate}>
              Crear Etiqueta
            </EntityCreateButton>
          </>
        }
      />
      <EntityIndexPage<OrderTag>
        ariaLabel="Etiquetas"
        cardTitle={
          <EntityCardTitle icon={Tag}>Catálogo de etiquetas</EntityCardTitle>
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
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
                placeholder="Buscar por nombre o slug"
                aria-label="Buscar por nombre o slug"
              />
            </InputGroup>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Estatus</span>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  handleStatusChange(value as StatusFilter)
                }
              >
                <SelectTrigger size="sm" className="min-w-36">
                  <SelectValue>{statusFilterLabel[statusFilter]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
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
          </div>
        }
        columns={columns}
        rows={paginatedTags}
        rowKey={(tag) => tag.id}
        loading={isLoading}
        hasError={Boolean(error)}
        errorMessage="No fue posible cargar las etiquetas."
        onRetry={() => mutate()}
        emptyMessage={
          search || statusFilter !== "all"
            ? "No hay etiquetas que coincidan con los filtros."
            : "No hay etiquetas registradas."
        }
        pagination={{
          mode: "page",
          total: filteredTags.length,
          page,
          pageSize: PAGE_SIZE,
          totalLabel: "etiquetas",
          onPageChange: (nextPage) => setPage(nextPage),
        }}
      />

      <CreateSaleOrderTagDialog
        open={formOpen}
        onOpenChange={(next) => {
          setFormOpen(next);
          if (!next) setEditingTag(undefined);
        }}
        tag={editingTag}
        onSuccess={handleFormSuccess}
      />
    </>
  );
}
