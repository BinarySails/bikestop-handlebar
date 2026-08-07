import { useState } from "react";

import { BrandActionDialog } from "./brand-action-dialog";
import { brandFixtures } from "./brand-fixtures";
import { BrandFormDialog, type BrandFormValues } from "./brand-form-dialog";
import { BrandsCatalogView } from "./brands-catalog-view";
import type { Brand } from "@/lib/api/schemas";

/** Development harness for validating all visual states without a backend. */
export function BrandsCatalogMock() {
  const [brands, setBrands] = useState(brandFixtures);
  const [search, setSearch] = useState("");
  const [archivedOnly, setArchivedOnly] = useState(false);
  const [formBrand, setFormBrand] = useState<Brand | null | undefined>();
  const [archiveBrand, setArchiveBrand] = useState<Brand | null>(null);

  async function saveBrand(values: BrandFormValues) {
    if (formBrand) {
      setBrands((items) =>
        items.map((item) =>
          item.id === formBrand.id ? { ...item, ...values } : item
        )
      );
    } else {
      setBrands((items) => [
        ...items,
        {
          ...values,
          id: crypto.randomUUID(),
          status: "enable",
          created_at: new Date().toISOString(),
        },
      ]);
    }
  }

  return (
    <>
      <BrandsCatalogView
        brands={brands.filter((brand) =>
          archivedOnly ? brand.status === "archive" : brand.status !== "archive"
        )}
        page={0}
        limit={10}
        total={brands.length}
        search={search}
        archivedOnly={archivedOnly}
        onSearchChange={setSearch}
        onArchivedOnlyChange={setArchivedOnly}
        onPageChange={() => undefined}
        onRetry={() => undefined}
        onCreate={() => setFormBrand(null)}
        onView={() => undefined}
        onEdit={() => undefined}
        onArchive={setArchiveBrand}
      />
      <BrandFormDialog
        key={formBrand?.id ?? "create"}
        open={formBrand !== undefined}
        brand={formBrand}
        onOpenChange={(open) => {
          if (!open) setFormBrand(undefined);
        }}
        onSubmit={saveBrand}
      />
      <BrandActionDialog
        brand={archiveBrand}
        onOpenChange={(open) => {
          if (!open) setArchiveBrand(null);
        }}
        onConfirm={() => setArchiveBrand(null)}
      />
    </>
  );
}
