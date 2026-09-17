import { useState } from "react";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

type BrandImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
};

export function BrandImage({ src, alt, className }: BrandImageProps) {
  const [failed, setFailed] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setFailed(false);
  }

  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted",
        className
      )}
    >
      {failed || !src ? (
        <span className="flex flex-col items-center text-muted-foreground">
          <ImageOff className="size-5" aria-hidden="true" />
          <span className="sr-only">Imagen no disponible para {alt}</span>
        </span>
      ) : (
        <img
          src={src}
          alt={`Logotipo de ${alt}`}
          className="size-full object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
