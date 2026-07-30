import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { useCreateBrandRequest } from "@/lib/api/api";
import { CreateBrandRequestBody } from "@/lib/api/zods";

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CreateBrandDialog() {
    const [open, setOpen] = useState(false);
    const { trigger } = useCreateBrandRequest();

    const form = useForm({
        defaultValues: {
            displayName: "",
            imageUrl: "",
        },
        onSubmit: async ({ value }) => {

            const result = await trigger({
                display_name: value.displayName,
                image_url: value.imageUrl,
            });

            const errorData = "data" in result ? (result as { data: { message?: string } }).data : null;

            if (result.status === 201) {
                toast.success(`Brand "${value.displayName}" created!`);
                form.reset();
                setOpen(false);
            } else {
                toast.error(errorData?.message ?? "Failed to create brand");
            }
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
                <Button>Crear Marca</Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Crear marca </DialogTitle>
                    <DialogDescription>
                        Ingresa la informacion para la nueva marca.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    className="space-y-4"
                >
                    <form.Field
                        name="displayName"
                        validators={{
                            onChange: ({ value }) => {
                                const result = CreateBrandRequestBody.shape.display_name.safeParse(value);
                                if (!result.success)
                                    return result.error.issues[0].message;
                                if (value.length < 3)
                                    return "El nombre de visualización debe tener al menos 3 caracteres.";
                                return undefined;
                            },
                        }}
                    >
                        {(field) => (
                            <div className="grid gap-2">
                                <Label htmlFor={field.name}>Nombre visible</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="Specialized"
                                    aria-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0 ? "true" : undefined}

                                />
                                {field.state.meta.errors?.[0] && (
                                    <p className="text-sm text-red-500">
                                        {field.state.meta.errors[0]}
                                    </p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    <form.Field
                        name="imageUrl"
                        validators={{
                            onChange: ({ value }) => {
                                const result = CreateBrandRequestBody.shape.image_url.safeParse(value || null);
                                return result.success ? undefined : result.error.issues[0].message;
                            },
                        }}
                    >
                        {(field) => (
                            <div className="grid gap-2">
                                <Label htmlFor={field.name}>Link de la imagen</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="https://"
                                />
                            </div>
                        )}
                    </form.Field>


                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>

                        <form.Subscribe
                            selector={(state) => [state.isSubmitting]}
                        >
                            {([isSubmitting]) => (
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Creando..." : "Crear Marca"}
                                </Button>
                            )}
                        </form.Subscribe>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
