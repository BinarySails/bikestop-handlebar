import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";

import { CatalogProductGrid } from "@/components/features/catalog/catalog-product-grid";
import { CatalogSidebar } from "@/components/features/catalog/catalog-sidebar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import {
  useGetCategoriesRequest,
  useListBrandsRequest,
  useListCatalogProductsRequest,
} from "@/lib/api/api";

export const Route = createFileRoute("/_b2b/catalog/")({
  component: CatalogPage,
});

const PAGE_SIZE = 20;

type SortOption =
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "created_at_desc";

type AvailabilityOption = "all" | "available" | "out_of_stock";

const sortOptionToParams: Record<
  SortOption,
  { sort_by: "Name" | "Price" | "CreatedAt"; sort_order: "Asc" | "Desc" }
> = {
  name_asc: { sort_by: "Name", sort_order: "Asc" },
  name_desc: { sort_by: "Name", sort_order: "Desc" },
  price_asc: { sort_by: "Price", sort_order: "Asc" },
  price_desc: { sort_by: "Price", sort_order: "Desc" },
  created_at_desc: { sort_by: "CreatedAt", sort_order: "Desc" },
};

const availabilityOptionToParam: Record<
  AvailabilityOption,
  "All" | "Available" | "OutOfStock" | undefined
> = {
  all: undefined,
  available: "Available",
  out_of_stock: "OutOfStock",
};

export function CatalogPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name_asc");
  const [availability, setAvailability] = useState<AvailabilityOption>("all");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);

  const { sort_by, sort_order } = sortOptionToParams[sortBy];

  const { data: productsRes, isLoading } = useListCatalogProductsRequest({
    page: page + 1,
    limit: PAGE_SIZE,
    search: appliedSearch || undefined,
    sort_by,
    sort_order,
    availability: availabilityOptionToParam[availability],
    category_id: selectedCategoryIds[0],
    brand_id: selectedBrandIds[0],
  });

  const { data: categoriesRes } = useGetCategoriesRequest();
  const { data: brandsRes } = useListBrandsRequest();

  const products = productsRes?.status === 200 ? productsRes.data.data : [];
  const total = productsRes?.status === 200 ? productsRes.data.total : 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const categories = useMemo(
    () => (categoriesRes?.status === 200 ? categoriesRes.data.categories : []),
    [categoriesRes]
  );

  const brands = useMemo(
    () => (brandsRes?.status === 200 ? brandsRes.data.data : []),
    [brandsRes]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search !== appliedSearch) {
        setAppliedSearch(search);
        setPage(0);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, appliedSearch]);

  function handleCategoryToggle(categoryId: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
    setPage(0);
  }

  function handleBrandToggle(brandId: string) {
    setSelectedBrandIds((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId]
    );
    setPage(0);
  }

  function handleSortByChange(value: string) {
    setSortBy(value as SortOption);
    setPage(0);
  }

  function handleAvailabilityChange(value: string) {
    setAvailability(value as AvailabilityOption);
    setPage(0);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-start gap-6">
        <CatalogSidebar
          categories={categories}
          brands={brands}
          sortBy={sortBy}
          onSortByChange={handleSortByChange}
          availability={availability}
          onAvailabilityChange={handleAvailabilityChange}
          selectedCategoryIds={selectedCategoryIds}
          onCategoryToggle={handleCategoryToggle}
          selectedBrandIds={selectedBrandIds}
          onBrandToggle={handleBrandToggle}
        />

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-xs">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full pl-9"
                aria-label="Buscar productos"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {total} producto{total !== 1 ? "s" : ""}
            </p>
          </div>

          <CatalogProductGrid products={products} isLoading={isLoading} />

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setPage((prev) => Math.max(0, prev - 1));
                    }}
                    aria-disabled={page === 0}
                    className={
                      page === 0 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setPage(index);
                      }}
                      isActive={index === page}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setPage((prev) => Math.min(totalPages - 1, prev + 1));
                    }}
                    aria-disabled={page === totalPages - 1}
                    className={
                      page === totalPages - 1
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
    </div>
  );
}
