import { useState } from "react";
import { useForm, useSelector } from "@tanstack/react-form";
import { toast } from "sonner";
import { useCreateCategoryRequest } from "@/lib/api/api";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateCategoryDialog() {
  const [open, setOpen] = useState(false);
  const { trigger } = useCreateCategoryRequest();

  const form = useForm({
    defaultValues: {
      displayName: "",
      description: "",
    },
    onSubmit: async ({ value }) => {
      const slug = value.displayName.toLowerCase().replace(/\s+/g, "-");

      const result = await trigger({
        display_name: value.displayName,
        slug,
        description: value.description || null,
      });

      const errorData = "data" in result ? (result as { data: { message?: string } }).data : null;

      if (result.status === 201) {
        toast.success(`Category "${value.displayName}" created!`);
        form.reset();
        setOpen(false);
      } else {
        toast.error(errorData?.message ?? "Failed to create category");
      }
    },
  });

  const displayName = useSelector(form.baseStore, (state) => state.values.displayName);
  const slug = displayName.toLowerCase().replace(/\s+/g, "-");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>Create Category</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
          <DialogDescription>
            Enter the information for the new category.
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
                if (!value) return "Display name is required";
                if (value.length < 2)
                  return "Display name must be at least 2 characters";
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Display Name</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Electronics"
                />
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-red-500">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              value={slug}
              disabled
            />
          </div>

          <form.Field name="description">
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Description</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Optional description"
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
              Cancel
            </Button>

            <form.Subscribe
              selector={(state) => state.isSubmitting}
            >
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Category"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
