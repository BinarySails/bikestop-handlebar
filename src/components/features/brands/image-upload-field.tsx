import { useId, useState } from "react";
import type { ChangeEvent } from "react";
import { ImageUp, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { BrandImage } from "@/components/features/brands/brand-image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFileRequest } from "@/lib/api/api";

async function sha256Checksum(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

type ImageUploadFieldProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
};

export function ImageUploadField({
  id,
  label = "Imagen de la marca",
  value,
  onChange,
  onUploadingChange,
  disabled,
}: ImageUploadFieldProps) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    onUploadingChange?.(true);
    try {
      const result = await createFileRequest({
        checksum: await sha256Checksum(file),
        content_type: file.type,
        file_name: file.name,
        file_type: "public",
        original_filename: file.name,
        size: file.size,
      });
      if (result.status !== 201) {
        toast.error(result.data?.message ?? "No se pudo preparar la imagen.");
        return;
      }

      const upload = await fetch(result.data.upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!upload.ok) {
        toast.error("No se pudo subir la imagen.");
        return;
      }

      onChange(result.data.public_url);
      toast.success("Imagen subida correctamente.");
    } catch {
      toast.error("No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      event.target.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <Input
          id={inputId}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading || disabled}
          className="cursor-pointer pr-10 file:cursor-pointer"
        />
        {uploading ? (
          <LoaderCircle className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          <ImageUp className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
      </div>
      {uploading && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Subiendo imagen…
        </p>
      )}
      {value && (
        <div className="flex items-center gap-3 rounded-xl border p-3">
          <BrandImage
            src={value}
            alt="Vista previa"
            className="size-16 rounded-xl"
          />
          <span className="text-xs text-muted-foreground">
            Vista previa de la imagen
          </span>
        </div>
      )}
    </div>
  );
}
