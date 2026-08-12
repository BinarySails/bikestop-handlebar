import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { ImageUploadField } from "@/components/features/products/image-upload-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type VariantImageRow = {
  imageUrl: string;
};

type VariantImageManagerProps = {
  images: VariantImageRow[];
  onChange: (images: VariantImageRow[]) => void;
  disabled?: boolean;
};

export function VariantImageManager({
  images,
  onChange,
  disabled,
}: VariantImageManagerProps) {
  function handleAdd() {
    onChange([...images, { imageUrl: "" }]);
  }

  function handleRemove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function handleMove(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(index, 1);
    next.splice(newIndex, 0, moved);
    onChange(next);
  }

  function handleChange(index: number, imageUrl: string) {
    const next = [...images];
    next[index] = { imageUrl };
    onChange(next);
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <Label>Imágenes</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled}
        >
          <Plus className="size-4" />
          Agregar imagen
        </Button>
      </div>

      {images.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay imágenes agregadas.
        </p>
      )}

      <div className="grid gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-lg border p-3"
          >
            <div className="grid flex-1 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  #{index + 1}
                </span>
                {index === 0 && (
                  <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                    Portada
                  </span>
                )}
              </div>
              <ImageUploadField
                id={`variant-image-${index}`}
                label={`Imagen ${index + 1}`}
                value={image.imageUrl}
                onChange={(url) => handleChange(index, url)}
                disabled={disabled}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => handleMove(index, -1)}
                disabled={disabled || index === 0}
                aria-label="Mover arriba"
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => handleMove(index, 1)}
                disabled={disabled || index === images.length - 1}
                aria-label="Mover abajo"
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-destructive"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                aria-label="Eliminar imagen"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
