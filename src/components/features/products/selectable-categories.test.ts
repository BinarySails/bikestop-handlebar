import { describe, expect, it } from "vitest";

import type { Category } from "@/lib/api/schemas";

import { getSelectableCategories } from "./selectable-categories";

const category = (id: string, status: Category["status"]): Category => ({
  id,
  display_name: id,
  slug: id,
  parent_id: null,
  description: null,
  created_at: "2026-01-01T00:00:00Z",
  status,
});

describe("getSelectableCategories", () => {
  it("only returns active categories", () => {
    const categories = [
      category("active", "enable"),
      category("inactive", "disable"),
      category("archived", "archive"),
    ];

    expect(getSelectableCategories(categories)).toEqual([categories[0]]);
  });
});
