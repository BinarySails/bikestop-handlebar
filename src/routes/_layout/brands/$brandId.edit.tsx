import { useState } from "react";
import type { FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { ImageUploadField } from "@/components/features/brands/image-upload-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { updateBrandRequest, useGetBrandRequest } from "@/lib/api/api";
import type { Brand } from "@/lib/api/schemas";

export const Route = createFileRoute("/_layout/brands/$brandId/edit")({
  component: BrandEditPage,
});

function BrandEditPage() {
  const { brandId } = Route.useParams();
  const navigate = useNavigate();
  const query = useGetBrandRequest(brandId);
  const brand = query.data?.status === 200 ? query.data.data : null;

  if (query.isLoading) {
    return <Skeleton className="mx-auto mt-8 h-80 w-full max-w-3xl" />;
  }
  if (!brand || query.error) {
    return (
      <div role="alert" className="mx-auto max-w-3xl space-y-4 p-6 text-center">
        <p>No se pudo cargar la marca para editarla.</p>
        <Button variant="outline" render={<Link to="/brands" />}>
          Volver a marcas
        </Button>
      </div>
    );
  }
  return (
    <BrandEditForm
      key={brand.id}
      brand={brand}
      onSaved={() => navigate({ to: "/brands", replace: true })}
    />
  );
}

function BrandEditForm({
  brand,
  onSaved,
}: {
  brand: Brand;
  onSaved: () => void;
}) {
  const [name, setName] = useState(brand.display_name);
  const [imageUrl, setImageUrl] = useState(brand.image_url);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    if (name.trim().length < 3) {
      setError("El nombre debe tener al menos 3 caracteres.");
      return;
    }
    try {
      const parsedImageUrl = new URL(imageUrl.trim());
      if (!["http:", "https:"].includes(parsedImageUrl.protocol))
        throw new Error();
    } catch {
      setError("Ingresa una URL de imagen válida.");
      return;
    }
    setPending(true);
    try {
      const result = await updateBrandRequest(brand.id, {
        display_name: name.trim(),
        image_url: imageUrl.trim(),
      });
      if (result.status !== 200) {
        setError(
          result.status === 409
            ? "Ya existe una marca con este nombre."
            : (result.data.message ?? "No se pudo actualizar la marca.")
        );
        return;
      }
      toast.success("Marca actualizada correctamente.");
      onSaved();
    } catch {
      setError("No se pudo actualizar la marca. Intenta nuevamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <Button variant="ghost" render={<Link to="/brands" />}>
        <ArrowLeft /> Volver a marcas
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Editar marca</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={submit}>
            <div className="grid gap-2">
              <Label htmlFor="display_name">Nombre visible</Label>
              <Input
                id="display_name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <ImageUploadField
              id="image_url"
              value={imageUrl}
              onChange={setImageUrl}
              onUploadingChange={setImageUploading}
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                render={<Link to="/brands" />}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending || imageUploading}>
                {pending ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
