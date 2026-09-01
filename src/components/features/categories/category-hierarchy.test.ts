import { describe, expect, it } from "vitest";

import type { Category } from "@/lib/api/schemas";

import { buildCategoryOptions, getDescendantIds } from "./category-hierarchy";

const categories: Category[] = [
  {
    id: "root",
    display_name: "Bicicletas",
    slug: "bicicletas",
    description: null,
    parent_id: null,
    status: "enable",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "child",
    display_name: "Montaña",
    slug: "montana",
    description: null,
    parent_id: "root",
    status: "enable",
    created_at: "2026-01-02T00:00:00Z",
  },
  {
    id: "grandchild",
    display_name: "Doble suspensión",
    slug: "doble",
    description: null,
    parent_id: "child",
    status: "disable",
    created_at: "2026-01-03T00:00:00Z",
  },
  {
    id: "orphan",
    display_name: "Huérfana",
    slug: "huerfana",
    description: null,
    parent_id: "missing",
    status: "enable",
    created_at: "2026-01-04T00:00:00Z",
  },
];

describe("category hierarchy", () => {
  it("orders roots, children and arbitrary depth while preserving orphans", () => {
    const options = buildCategoryOptions(categories);
    expect(options.map(({ category, depth }) => [category.id, depth])).toEqual([
      ["root", 0],
      ["child", 1],
      ["grandchild", 2],
      ["orphan", 0],
    ]);
  });

  it("finds every descendant to prevent hierarchy cycles", () => {
    expect([...getDescendantIds(categories, "root")]).toEqual(
      expect.arrayContaining(["child", "grandchild"])
    );
  });
});
