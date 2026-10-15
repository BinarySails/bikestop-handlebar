// @vitest-environment jsdom
/* oxlint-disable vitest/require-mock-type-parameters */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Product, Promotion } from "@/lib/api/schemas";

import { PromotionsCatalog } from "./promotions-catalog";

const api = vi.hoisted(() => ({
  getCatalogProduct: vi.fn(),
  getProduct: vi.fn(),
  listVariants: vi.fn(),
  listPromotions: vi.fn(),
  mutate: vi.fn(),
  updatePromotionStatus: vi.fn(),
}));

vi.mock("@/lib/api/api", () => ({
  getCatalogProductRequest: api.getCatalogProduct,
  getProductRequest: api.getProduct,
  listVariantsRequest: api.listVariants,
  updatePromotionStatusRequest: api.updatePromotionStatus,
  useListPromotionsRequest: api.listPromotions,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/features/layout/site-header", () => ({
  SiteHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock("./create-promotion-dialog", () => ({
  CreatePromotionDialog: () => null,
}));

const productId = "product-1";
const product: Product = {
  id: productId,
  display_name: "Freno delantero",
  status: "enable",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  brand: {
    id: "brand-1",
    display_name: "Ciclo",
    status: "enable",
    image_url: "https://example.com/ciclo.png",
    created_at: "2026-01-01T00:00:00Z",
  },
  category: {
    id: "category-1",
    display_name: "Frenos",
    slug: "frenos",
    status: "enable",
    created_at: "2026-01-01T00:00:00Z",
  },
};

const promotion = (status: Promotion["status"]): Promotion => ({
  id: `promotion-${status}`,
  code: `PROMO-${status.toUpperCase()}`,
  status,
  is_automatic: false,
  used_count: 0,
  usage_limit: null,
  starts_at: null,
  ends_at: null,
  stacking: "not_combinable",
  rules: [],
  application_method: {
    Standard: {
      target: "items",
      target_rules: [
        {
          attribute: "product_id",
          operator: "in",
          values: [{ uuid: productId }],
        },
        {
          attribute: "variant_id",
          operator: "in",
          values: [{ uuid: "variant-1" }],
        },
      ],
      value: { percentage: 10 },
    },
  },
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
});

describe("PromotionsCatalog", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("lists all promotion states, expands product rules, and toggles a status", async () => {
    const mutate = vi.fn();
    api.listPromotions.mockReturnValue({
      data: {
        status: 200,
        data: [promotion("active"), promotion("inactive"), promotion("draft")],
      },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate,
    });
    api.getProduct.mockResolvedValue({ status: 200, data: product });
    api.getCatalogProduct.mockResolvedValue({
      status: 200,
      data: {
        product_id: productId,
        display_name: "Pastillas cerámicas - Delantera",
        images: [
          {
            status: "enable",
            image_index: 1,
            image_url: "https://example.com/pastillas.png",
          },
        ],
      },
    });
    api.listVariants.mockResolvedValue({
      status: 200,
      data: [
        {
          status: "enable",
          images: [
            {
              status: "enable",
              image_index: 1,
              image_url: "https://example.com/brake.png",
            },
          ],
        },
      ],
    });
    api.updatePromotionStatus.mockResolvedValue({
      status: 200,
      data: promotion("active"),
    });

    const { container } = render(<PromotionsCatalog />);

    expect(screen.getByText("Todas las promociones")).toBeTruthy();
    expect(screen.getByText("Activa")).toBeTruthy();
    expect(screen.getByText("Inactiva")).toBeTruthy();
    expect(screen.getByText("Borrador")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Ver detalles de PROMO-INACTIVE" })
    );
    await waitFor(() =>
      expect(screen.getAllByText("Freno delantero").length).toBe(2)
    );
    expect(
      await screen.findByText("Pastillas cerámicas - Delantera")
    ).toBeTruthy();
    expect(
      container.querySelector('img[src="https://example.com/pastillas.png"]')
    ).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Activar" })[0]);
    await waitFor(() =>
      expect(api.updatePromotionStatus).toHaveBeenCalledWith(
        "promotion-inactive",
        { status: "active" }
      )
    );
    await waitFor(() => expect(mutate).toHaveBeenCalled());
  });
});
