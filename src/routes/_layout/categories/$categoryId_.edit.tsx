import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { CategoryFormDialog } from "@/components/features/categories/category-form-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CategoryApiError,
  useCategories,
  useCategory,
} from "@/lib/api/categories";

export const Route = createFileRoute("/_layout/categories/$categoryId_/edit")({
  component: CategoryEditPage,
});

function CategoryEditPage() {
  const { categoryId } = Route.useParams();
  const navigate = useNavigate();
  const detailQuery = useCategory(categoryId);
  const categoriesQuery = useCategories();
  const category = detailQuery.data?.category;

  const goToDetail = () => {
    navigate({
      to: "/categories/$categoryId",
      params: { categoryId },
    });
  };

  if (detailQuery.isLoading || categoriesQuery.isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[32rem] w-full rounded-xl" />
      </main>
    );
  }

  if (detailQuery.error || !category || categoriesQuery.error) {
    const notFound =
      detailQuery.error instanceof CategoryApiError &&
      detailQuery.error.status === 404;

    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">
          {notFound
            ? "Categoría no encontrada"
            : "No se pudo cargar la edición"}
        </h1>
        <Button variant="outline" render={<Link to="/categories" />}>
          Volver a categorías
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <Button
          variant="outline"
          size="icon"
          aria-label="Volver al detalle"
          render={<Link to="/categories/$categoryId" params={{ categoryId }} />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Editar categoría
          </h1>
          <p className="text-sm text-muted-foreground">
            Modifica la información y la ubicación de {category.display_name}.
          </p>
        </div>
      </div>

      <CategoryFormDialog
        open
        onOpenChange={(open) => {
          if (!open) goToDetail();
        }}
        categories={categoriesQuery.data?.categories ?? []}
        category={category}
        presentation="page"
      />
    </main>
  );
}
