import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  CircleCheck,
  CircleX,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";

import { useListTags, deleteTag, invalidateTags } from "@/lib/api/tags";
import type { SaleOrderTag } from "@/lib/api/schemas";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateSaleOrderTagDialog } from "@/components/features/sales/tags/create-sale-order-tag-dialog";

export const Route = createFileRoute("/_layout/sales/tags")({
  component: TagsPage,
});

type StatusFilter = "all" | "active" | "inactive";

const statusFilterLabel: Record<StatusFilter, string> = {
  all: "Todos",
  active: "Activos",
  inactive: "Inactivos",
};

function TagsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<SaleOrderTag | undefined>(
    undefined
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, mutate } = useListTags({
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const allTags = data?.tag ?? [];

  const filteredTags = allTags.filter((tag) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      tag.display_name.toLowerCase().includes(query) ||
      tag.slug.toLowerCase().includes(query)
    );
  });

  const handleCreate = () => {
    setEditingTag(undefined);
    setFormOpen(true);
  };

  const handleEdit = (tag: SaleOrderTag) => {
    setEditingTag(tag);
    setFormOpen(true);
  };

  const handleDelete = async (tag: SaleOrderTag) => {
    if (!confirm(`¿Eliminar etiqueta "${tag.display_name}"?`)) return;
    try {
      await deleteTag(tag.id);
      invalidateTags();
    } catch {
      // Error handled by API
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingTag(undefined);
    mutate();
  };

  function handleStatusChange(value: StatusFilter | null) {
    setStatusFilter(value ?? "all");
  }

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("all");
  }

  return (
    <section
      aria-label="Etiquetas"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            render={<Link to="/sales" />}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="size-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Etiquetas</h1>
          <p className="text-sm text-muted-foreground">
            Administra las etiquetas de órdenes de venta.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus />
          Crear Etiqueta
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tag-search">Búsqueda</Label>
            <div className="relative">
              <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                id="tag-search"
                placeholder="Nombre o slug"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-72 pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tag-status">Estatus</Label>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger id="tag-status" className="w-44">
                <SelectValue
                  placeholder="Seleccionar"
                  render={() => <span>{statusFilterLabel[statusFilter]}</span>}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">&nbsp;</span>
            <Button
              className="h-8"
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredTags.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {search || statusFilter !== "all"
                ? "No hay etiquetas que coincidan con los filtros."
                : "No hay etiquetas registradas."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Color</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTags.map((tag) => (
                  <TableRow
                    key={tag.id}
                    className="cursor-pointer"
                    onClick={() => handleEdit(tag)}
                  >
                    <TableCell>
                      {tag.color ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="size-4 rounded-full border"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="font-mono text-xs text-muted-foreground">
                            {tag.color}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {tag.display_name}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {tag.slug}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tag.status === "active" ? "default" : "secondary"
                        }
                        className="gap-1"
                      >
                        {tag.status === "active" ? (
                          <CircleCheck className="size-3" />
                        ) : (
                          <CircleX className="size-3" />
                        )}
                        {tag.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-sm" />}
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(tag)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleDelete(tag)}
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateSaleOrderTagDialog
        open={formOpen}
        onOpenChange={(next) => {
          setFormOpen(next);
          if (!next) setEditingTag(undefined);
        }}
        tag={editingTag}
        onSuccess={handleFormSuccess}
      />
    </section>
  );
}
