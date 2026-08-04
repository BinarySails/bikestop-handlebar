// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  archiveBrand,
  BrandApiError,
  createBrand,
  getBrand,
  getBrandsUrl,
  listBrands,
  toggleBrand,
  updateBrand,
} from "./brands";

const brand = {
  id: "brand-id",
  display_name: "Trek",
  image_url: "https://example.com/trek.png",
  status: "enable" as const,
  created_at: "2025-01-01T00:00:00Z",
};

describe("brands API integration", () => {
  afterEach(() => vi.restoreAllMocks());

  it("encodes pagination, search and order while preserving page zero", () => {
    expect(getBrandsUrl({ page: 0, limit: 20, display_name: "  ruta & montaña ", order: "desc" })).toBe(
      "http://localhost:8080/api/v1/products/brands?page=0&limit=20&display_name=ruta+%26+monta%C3%B1a&order=desc"
    );
  });

  it("uses the paginated response without local filtering", async () => {
    const response = { data: [brand], page: 1, limit: 10, total: 21 };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    await expect(listBrands({ page: 1, limit: 10 })).resolves.toEqual(response);
  });

  it("calls detail, create, update, toggle and archive with the documented methods and bodies", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () =>
        new Response(JSON.stringify(brand), { status: 200 })
      );
    await getBrand("brand-id");
    await createBrand({ display_name: "Trek", image_url: brand.image_url });
    await updateBrand("brand-id", { display_name: "Trek", image_url: brand.image_url });
    await toggleBrand("brand-id");
    await archiveBrand("brand-id");

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init?.method ?? "GET"])).toEqual([
      ["http://localhost:8080/api/v1/products/brands/brand-id", "GET"],
      ["http://localhost:8080/api/v1/products/brands", "POST"],
      ["http://localhost:8080/api/v1/products/brands/brand-id", "PATCH"],
      ["http://localhost:8080/api/v1/products/brands/brand-id/toggle", "PATCH"],
      ["http://localhost:8080/api/v1/products/brands/brand-id", "DELETE"],
    ]);
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({ display_name: "Trek", image_url: brand.image_url });
    expect(JSON.parse(String(fetchMock.mock.calls[2][1]?.body))).not.toHaveProperty("status");
  });

  it("preserves 409 errors without exposing internal data", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ type: "conflict", message: "duplicate" }), { status: 409 }));
    await expect(updateBrand("brand-id", { display_name: "Trek", image_url: brand.image_url })).rejects.toEqual(
      expect.objectContaining({ status: 409, message: "duplicate" })
    );
  });

  it("uses a typed error for server failures", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 500 }));
    await expect(toggleBrand("brand-id")).rejects.toBeInstanceOf(BrandApiError);
  });
});
