import { useState } from "react";
import { useForm, useSelector } from "@tanstack/react-form";
import { toast } from "sonner";
import {
  useCreateCategoryRequest,
  useGetCategoriesRequest,
} from "@/lib/api/api";
import { CreateCategoryRequestBody } from "@/lib/api/zods";

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
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import type { Category } from "@/lib/api/schemas";

export function CreateCategoryDialog() {
  const [open, setOpen] = useState(false);
  const { trigger } = useCreateCategoryRequest();
  const { data: categoriesRes, isLoading: categoriesLoading } =
    useGetCategoriesRequest();

  const categories =
    categoriesRes?.status === 200 ? categoriesRes.data.categories : [];

  const form = useForm({
    defaultValues: {
      displayName: "",
      description: "",
      parent: null as null | Category,
    },
    onSubmit: async ({ value }) => {
      const slug = value.displayName.toLowerCase().replace(/\s+/g, "-");

      const result = await trigger({
        display_name: value.displayName,
        slug,
        description: value.description || null,
        parent_id: value.parent?.id || null,
      });

      const errorData =
        "data" in result
          ? (result as { data: { message?: string } }).data
          : null;

      if (result.status === 201) {
        toast.success(`Category "${value.displayName}" created!`);
        form.reset();
        setOpen(false);
      } else {
        toast.error(errorData?.message ?? "Failed to create category");
      }
    },
  });

  const displayName = useSelector(
    form.baseStore,
    (state) => state.values.displayName
  );
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
                const result =
                  CreateCategoryRequestBody.shape.display_name.safeParse(value);
                if (!result.success) return result.error.issues[0].message;
                if (value.length < 3)
                  return "Display name must be at least 3 characters";
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
                  aria-invalid={
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                      ? "true"
                      : undefined
                  }
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
            <Input id="slug" name="slug" value={slug} disabled />
          </div>

          <form.Field
            name="description"
            validators={{
              onChange: ({ value }) => {
                const result =
                  CreateCategoryRequestBody.shape.description.safeParse(
                    value || null
                  );
                return result.success
                  ? undefined
                  : result.error.issues[0].message;
              },
            }}
          >
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

          <form.Field name="parent">
            {(field) => (
              <div className="grid gap-2">
                <Label>Parent Category</Label>
                <Combobox
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                  items={categories}
                  itemToStringValue={(item) => item.id}
                  itemToStringLabel={(item) => item.display_name}
                >
                  <ComboboxInput
                    placeholder={
                      categoriesLoading
                        ? "Loading categories..."
                        : "Select a parent category..."
                    }
                    showTrigger
                    showClear
                    disabled={categoriesLoading}
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No categories found</ComboboxEmpty>

                    <ComboboxList>
                      {(item: Category) => (
                        <ComboboxItem key={item.id} value={item}>
                          {item.display_name}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
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

            <form.Subscribe selector={(state) => [state.isSubmitting]}>
              {([isSubmitting]) => (
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
