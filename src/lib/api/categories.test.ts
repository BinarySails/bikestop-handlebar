// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createCategory,
  getCategoriesUrl,
  listCategories,
  updateCategory,
} from "./categories";

describe("categories API", () => {
  afterEach(() => vi.restoreAllMocks());

  it("encodes non-empty server filters and omits empty values", () => {
    expect(getCategoriesUrl({ display_name: "  montaña & ruta  ", order: "desc" }))
      .toBe("http://localhost:8080/api/v1/products/categories?display_name=monta%C3%B1a+%26+ruta&order=desc");
    expect(getCategoriesUrl({ display_name: "" }))
      .toBe("http://localhost:8080/api/v1/products/categories");
  });

  it("uses the categories response envelope from OpenAPI", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ categories: [] }), { status: 200 }));
    await expect(listCategories()).resolves.toEqual({ categories: [] });
  });

  it("sends create and update bodies without status", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ id: "id" }), { status: 201 }));
    await createCategory({ display_name: "Ruta", slug: "ruta", description: null, parent_id: null });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ display_name: "Ruta", slug: "ruta", description: null, parent_id: null });

    fetchMock.mockResolvedValue(new Response(JSON.stringify({ category: { id: "id" } }), { status: 200 }));
    await updateCategory("id", { display_name: "Ruta", slug: "ruta", description: null, parent_id: "parent" });
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).not.toHaveProperty("status");
  });

  it("exposes backend status and message on errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ type: "validation", message: "slug duplicado" }), { status: 400 }));
    await expect(createCategory({ display_name: "Ruta", slug: "ruta" })).rejects.toEqual(
      expect.objectContaining({ status: 400, message: "slug duplicado" })
    );
  });
});
