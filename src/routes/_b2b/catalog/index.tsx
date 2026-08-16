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
  { sort_by: "name" | "price" | "created_at"; sort_order: "asc" | "desc" }
> = {
  name_asc: { sort_by: "name", sort_order: "asc" },
  name_desc: { sort_by: "name", sort_order: "desc" },
  price_asc: { sort_by: "price", sort_order: "asc" },
  price_desc: { sort_by: "price", sort_order: "desc" },
  created_at_desc: { sort_by: "created_at", sort_order: "desc" },
};

const availabilityOptionToParam: Record<
  AvailabilityOption,
  "all" | "available" | "out_of_stock" | undefined
> = {
  all: undefined,
  available: "available",
  out_of_stock: "out_of_stock",
};

export function matchesCatalogProductSearch(
  product: {
    id?: string | null;
    display_name?: string | null;
    prices?: { price_type?: string | null; amount?: number | null }[] | null;
    brand?: { display_name?: string | null } | null;
    category?: { display_name?: string | null } | null;
  },
  query: string
) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const priceAmount = product.prices?.find(
    (price) => price.price_type === "regular"
  )?.amount;
  const priceValue =
    typeof priceAmount === "number" ? String(priceAmount / 100) : "";

  return [
    product.id,
    product.display_name,
    product.brand?.display_name,
    product.category?.display_name,
    priceValue,
    typeof priceAmount === "number" ? String(priceAmount) : "",
  ]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(normalizedQuery));
}

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

  const products = useMemo(
    () => (productsRes?.status === 200 ? productsRes.data.data : []),
    [productsRes]
  );
  const total = productsRes?.status === 200 ? productsRes.data.total : 0;
  const visibleProducts = useMemo(() => {
    const normalizedSearch = appliedSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return products;
    }

    return products.filter((product) =>
      matchesCatalogProductSearch(product, normalizedSearch)
    );
  }, [appliedSearch, products]);
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
    <div className="px-4 py-4 sm:px-6">
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
              {visibleProducts.length} producto
              {visibleProducts.length !== 1 ? "s" : ""}
            </p>
          </div>

          <CatalogProductGrid
            products={visibleProducts}
            isLoading={isLoading}
          />

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
