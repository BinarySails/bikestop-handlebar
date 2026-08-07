import { useId, useState } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateFileRequest } from "@/lib/api/api";

async function sha256Checksum(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

type ImageUploadFieldProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
};

export function ImageUploadField({
  id,
  label,
  value,
  onChange,
  disabled,
}: ImageUploadFieldProps) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const { trigger: createFile } = useCreateFileRequest();
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen.");
      return;
    }

    setIsUploading(true);
    try {
      const checksum = await sha256Checksum(file);
      const createResult = await createFile({
        checksum,
        content_type: file.type,
        file_name: file.name,
        file_type: "public",
        original_filename: file.name,
        size: file.size,
      });

      if (createResult.status !== 201) {
        toast.error("Error al preparar la subida de la imagen.");
        return;
      }

      const { upload_url, public_url } = createResult.data;

      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) {
        toast.error("Error al subir la imagen.");
        return;
      }

      onChange(public_url);
      toast.success("Imagen subida correctamente.");
    } catch {
      toast.error("Error al subir la imagen.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  function handleClear() {
    onChange("");
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={inputId}
          name={inputId}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading || disabled}
          className="file:inline-flex"
        />
        {isUploading && (
          <Button type="button" variant="outline" disabled>
            <Upload className="size-4 animate-pulse" />
          </Button>
        )}
      </div>
      {value ? (
        <div className="flex items-start gap-3 rounded-lg border p-3">
          <img
            src={value}
            alt="Vista previa"
            className="size-16 rounded-md object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs break-all text-muted-foreground">{value}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 h-auto px-0 py-1 text-xs text-destructive"
              onClick={handleClear}
              disabled={disabled}
            >
              <X className="size-3" />
              Quitar imagen
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
