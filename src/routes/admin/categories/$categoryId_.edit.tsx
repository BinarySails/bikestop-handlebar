import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { CategoryFormDialog } from "@/components/features/categories/category-form-dialog";
import { EntityDetailHeader } from "@/components/features/entity/entity-detail-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCategoriesRequest, useGetCategoryRequest } from "@/lib/api/api";

export const Route = createFileRoute("/admin/categories/$categoryId_/edit")({
  component: CategoryEditPage,
});

function CategoryEditPage() {
  const { categoryId } = Route.useParams();
  const navigate = useNavigate();
  const detailQuery = useGetCategoryRequest(categoryId);
  const categoriesQuery = useGetCategoriesRequest();
  const category =
    detailQuery.data?.status === 200
      ? detailQuery.data.data.category
      : undefined;
  const categories =
    categoriesQuery.data?.status === 200
      ? categoriesQuery.data.data.categories
      : [];

  const goToDetail = () => {
    navigate({
      to: "/admin/categories/$categoryId",
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

  if (
    detailQuery.error ||
    detailQuery.data?.status !== 200 ||
    !category ||
    categoriesQuery.error ||
    (categoriesQuery.data && categoriesQuery.data.status !== 200)
  ) {
    const notFound = detailQuery.data?.status === 404;

    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">
          {notFound
            ? "Categoría no encontrada"
            : "No se pudo cargar la edición"}
        </h1>
        <Button variant="outline" render={<Link to="/admin/categories" />}>
          Volver a categorías
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <EntityDetailHeader
        backTo="/categories/$categoryId"
        backParams={{ categoryId }}
        backLabel="Volver al detalle"
        title="Editar categoría"
        subtitle={`Modifica la información y la ubicación de ${category.display_name}.`}
      />

      <CategoryFormDialog
        open
        onOpenChange={(open) => {
          if (!open) goToDetail();
        }}
        categories={categories}
        category={category}
        presentation="page"
        onSaved={async () => {
          await Promise.all([detailQuery.mutate(), categoriesQuery.mutate()]);
        }}
      />
    </main>
  );
}
