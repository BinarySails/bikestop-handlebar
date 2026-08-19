import { useState } from "react";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";
import type { VariantImage } from "@/lib/api/schemas";

interface ProductImageGalleryProps {
  images: VariantImage[];
  productName: string;
}

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const sortedImages = [...images].sort(
    (a, b) => a.image_index - b.image_index
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = sortedImages[selectedIndex];

  return (
    <div className="flex flex-col gap-2 sm:flex-row lg:h-full lg:min-h-0">
      {sortedImages.length > 1 && (
        <div className="flex gap-2 sm:flex-col">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`Ver imagen ${index + 1} de ${productName}`}
              className={cn(
                "size-12 shrink-0 overflow-hidden rounded-md border bg-muted transition-colors",
                index === selectedIndex
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:border-foreground/30"
              )}
            >
              <img
                src={image.image_url}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      <div className="h-[280px] w-full flex-1 overflow-hidden rounded-xl border bg-muted sm:h-[340px] lg:h-full lg:min-h-0">
        {selectedImage ? (
          <img
            src={selectedImage.image_url}
            alt={productName}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="size-10" />
            <span className="text-sm">Imagen no disponible</span>
          </div>
        )}
      </div>
    </div>
  );
}
