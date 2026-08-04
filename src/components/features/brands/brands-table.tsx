import type { Brand } from "@/lib/api/schemas";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@tanstack/react-router";
import { MoreVertical } from "lucide-react";

const statusBadgeVariant: Record<
  Brand["status"],
  "default" | "secondary" | "destructive"
> = {
  enable: "default",
  disable: "secondary",
  archive: "destructive",
};

const statusLabel: Record<Brand["status"], string> = {
  enable: "Activa",
  disable: "Inactiva",
  archive: "Archivada",
};

type BrandsTableProps = {
  brands: Brand[];
  activeBrandId?: string;
};

export function BrandsTable({ brands, activeBrandId }: BrandsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Logo</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {brands.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={4}
              className="text-center text-muted-foreground"
            >
              No hay marcas registradas.
            </TableCell>
          </TableRow>
        )}
        {brands.map((brand) => (
          <TableRow
            key={brand.id}
            data-active={brand.id === activeBrandId || undefined}
            className="data-[active=true]:bg-muted/40"
          >
            <TableCell>
              <Avatar size="sm">
                {brand.image_url ? (
                  <AvatarImage src={brand.image_url} alt={brand.display_name} />
                ) : null}
              </Avatar>
            </TableCell>
            <TableCell className="font-medium">{brand.display_name}</TableCell>
            <TableCell>
              <Badge variant={statusBadgeVariant[brand.status]}>
                {statusLabel[brand.status]}
              </Badge>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Acciones de ${brand.display_name}`}
                      className="size-8"
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <Link
                    to="/brands/$brandId"
                    params={{
                      brandId: brand.id,
                    }}
                  >
                    <DropdownMenuItem>Ver</DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">
                    <span>Eliminar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
