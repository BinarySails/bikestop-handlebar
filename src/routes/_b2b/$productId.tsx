import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { ProductImageGallery } from "@/components/features/catalog/product-image-gallery";
import { ProductInfoPanel } from "@/components/features/catalog/product-info-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCatalogProductRequest } from "@/lib/api/api";

export const Route = createFileRoute("/_b2b/$productId")({
  component: ProductDetailPage,
});

function BackToCatalogButton() {
  return (
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
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="px-4 py-3 sm:px-6">
      <Skeleton className="mb-3 h-8 w-40" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-[360px] w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const { data: res, isLoading } = useGetCatalogProductRequest(productId);

  const product = res?.status === 200 ? res.data : null;

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <p className="text-muted-foreground">
          Producto no encontrado o no disponible.
        </p>
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 py-3 sm:px-6 lg:h-full">
      <BackToCatalogButton />

      <div className="grid grid-cols-1 gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-2">
        <ProductImageGallery
          images={product.images}
          productName={product.display_name}
        />
        <ProductInfoPanel product={product} />
      </div>
    </div>
  );
}
