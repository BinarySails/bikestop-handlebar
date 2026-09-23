import { ImageOff } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useListVariantsRequest } from "@/lib/api/api";
import type { ProductId } from "@/lib/api/schemas";
import { cn } from "@/lib/utils";

interface ProductThumbnailProps {
  productId: ProductId;
  alt: string;
  className?: string;
}

export function ProductThumbnail({
  productId,
  alt,
  className,
}: ProductThumbnailProps) {
  const { data, isLoading } = useListVariantsRequest(productId, undefined, {
    swr: { revalidateOnFocus: false },
  });

  const variants =
    data?.status === 200
      ? [...data.data].sort((a, b) => a.created_at.localeCompare(b.created_at))
      : [];
  const firstImage = variants[0]?.images
    ?.slice()
    .sort((a, b) => a.image_index - b.image_index)[0];

  if (isLoading) {
    return (
      <Skeleton className={cn("size-10 shrink-0 rounded-md", className)} />
    );
  }

  if (!firstImage) {
    return (
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground",
          className
        )}
        aria-label="Sin imagen"
      >
        <ImageOff className="size-4" />
      </div>
    );
  }

  return (
    <img
      src={firstImage.image_url}
      alt={alt}
      loading="lazy"
      className={cn(
        "size-10 shrink-0 rounded-md border object-cover",
        className
      )}
    />
  );
}
