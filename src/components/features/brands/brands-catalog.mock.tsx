import { useState } from "react";

import { BrandActionDialog, type BrandAction } from "./brand-action-dialog";
import { BrandDetailDialog } from "./brand-detail-dialog";
import { brandFixtures } from "./brand-fixtures";
import { BrandFormDialog, type BrandFormValues } from "./brand-form-dialog";
import { BrandsCatalogView, type BrandOrder } from "./brands-catalog-view";
import type { Brand } from "@/lib/api/schemas";

/** Development harness for validating all visual states without a backend. */
export function BrandsCatalogMock() {
  const [brands, setBrands] = useState(brandFixtures);
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState<BrandOrder>();
  const [formBrand, setFormBrand] = useState<Brand | null | undefined>();
  const [detailBrand, setDetailBrand] = useState<Brand | null>(null);
  const [action, setAction] = useState<{
    brand: Brand;
    type: BrandAction;
  } | null>(null);

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
        brands={brands}
        page={0}
        limit={10}
        total={brands.length}
        search={search}
        order={order}
        onSearchChange={setSearch}
        onOrderChange={setOrder}
        onLimitChange={() => undefined}
        onPageChange={() => undefined}
        onClearFilters={() => {
          setSearch("");
          setOrder(undefined);
        }}
        onRetry={() => undefined}
        onCreate={() => setFormBrand(null)}
        onView={setDetailBrand}
        onEdit={(brand) => setFormBrand(brand)}
        onToggle={(brand) => setAction({ brand, type: "toggle" })}
        onArchive={(brand) => setAction({ brand, type: "archive" })}
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
      <BrandDetailDialog
        open={Boolean(detailBrand)}
        brand={detailBrand}
        onOpenChange={(open) => {
          if (!open) setDetailBrand(null);
        }}
        onRetry={() => undefined}
      />
      <BrandActionDialog
        brand={action?.brand ?? null}
        action={action?.type ?? "toggle"}
        onOpenChange={(open) => {
          if (!open) setAction(null);
        }}
        onConfirm={() => setAction(null)}
      />
    </>
  );
}
