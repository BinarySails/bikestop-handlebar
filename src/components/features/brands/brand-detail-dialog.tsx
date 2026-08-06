import { BrandImage } from "@/components/features/brands/brand-image";
import { BrandStatusBadge } from "@/components/features/brands/brand-status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Brand } from "@/lib/api/schemas";

const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });

type BrandDetailDialogProps = {
  open: boolean;
  brand: Brand | null;
  loading?: boolean;
  error?: string | null;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
};

export function BrandDetailDialog({
  open,
  brand,
  loading,
  error,
  onOpenChange,
  onRetry,
}: BrandDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalle de marca</DialogTitle>
          <DialogDescription>
            Información registrada en el catálogo.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="space-y-3" aria-label="Cargando detalle de marca">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <div role="alert" className="space-y-3 text-center">
            <p>{error}</p>
            <Button variant="outline" onClick={onRetry}>
              Reintentar
            </Button>
          </div>
        ) : brand ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <BrandImage
                src={brand.image_url}
                alt={brand.display_name}
                className="size-20"
              />
              <div>
                <h2 className="text-lg font-semibold">{brand.display_name}</h2>
                <BrandStatusBadge status={brand.status} />
              </div>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Identificador</dt>
                <dd className="font-mono text-xs break-all">{brand.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  Fecha de creación
                </dt>
                <dd>{dateFormatter.format(new Date(brand.created_at))}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">URL de imagen</dt>
                <dd className="text-sm break-all">{brand.image_url}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
