import { ImageOff } from "lucide-react";

import { useGetVariantRequest } from "@/lib/api/api";
import type { VariantImage } from "@/lib/api/schemas";
import { cn } from "@/lib/utils";

export function pickMainImageUrl(
  images: VariantImage[] | undefined
): string | null {
  if (!images || images.length === 0) return null;
  return (
    [...images].sort((a, b) => a.image_index - b.image_index)[0]?.image_url ??
    null
  );
}

/**
 * Thumbnail for a sales-order product line. A line loaded from a saved order
 * only carries `variant_id` (no images), so the variant is fetched when no
 * embedded images are supplied; a line just picked from a combobox already
 * has them and skips the request.
 */
export function ProductLineThumbnail({
  productId,
  variantId,
  embeddedImages,
  alt,
  className,
}: {
  productId: string | null;
  variantId: string | null;
  embeddedImages?: VariantImage[];
  alt: string;
  className?: string;
}) {
  const embeddedUrl = pickMainImageUrl(embeddedImages);

  const { data } = useGetVariantRequest(productId ?? "", variantId ?? "", {
    swr: { enabled: Boolean(productId && variantId && !embeddedUrl) },
  });
  const fetchedUrl =
    data?.status === 200 ? pickMainImageUrl(data.data.images) : null;
  const imageUrl = embeddedUrl ?? fetchedUrl;

  return (
    <div
      className={cn(
        "flex size-16 shrink-0 items-center justify-center self-start overflow-hidden rounded-md border bg-muted",
        className
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          className="size-full object-cover"
          loading="lazy"
        />
      ) : (
        <ImageOff className="size-5 text-muted-foreground" />
      )}
    </div>
  );
}
