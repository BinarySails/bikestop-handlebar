// @vitest-environment jsdom
/* oxlint-disable vitest/require-mock-type-parameters */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Category } from "@/lib/api/schemas";

import { CategoryFormDialog } from "./category-form-dialog";

const api = vi.hoisted(() => ({
  create: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  update: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  invalidate: vi.fn<() => Promise<void>>(),
}));

vi.mock("@/lib/api/categories", () => ({
  CategoryApiError: class extends Error {},
  createCategory: api.create,
  updateCategory: api.update,
  invalidateCategories: api.invalidate,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const root: Category = {
  id: "root",
  display_name: "Bicicletas",
  slug: "bicicletas",
  description: null,
  parent_id: null,
  status: "active",
  created_at: "2026-01-01T00:00:00Z",
};
const child: Category = {
  id: "child",
  display_name: "Montaña",
  slug: "montana",
  description: "Para montaña",
  parent_id: "root",
  status: "active",
  created_at: "2026-01-02T00:00:00Z",
};
const grandchild: Category = {
  id: "grandchild",
  display_name: "Enduro",
  slug: "enduro",
  description: null,
  parent_id: "child",
  status: "active",
  created_at: "2026-01-03T00:00:00Z",
};

describe("CategoryFormDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.create.mockResolvedValue({});
    api.update.mockResolvedValue({});
    api.invalidate.mockResolvedValue();
  });
  afterEach(cleanup);

  it.each([
    ["", null],
    ["root", "root"],
  ])(
    "creates a category with parent value %s",
    async (selectedParent, expectedParent) => {
      render(
        <CategoryFormDialog open onOpenChange={vi.fn()} categories={[root]} />
      );
      fireEvent.change(screen.getByLabelText("Nombre visible"), {
        target: { value: "Accesorios" },
      });
      fireEvent.change(screen.getByLabelText("Slug"), {
        target: { value: "accesorios" },
      });
      if (selectedParent)
        fireEvent.change(screen.getByLabelText("Categoría padre"), {
          target: { value: selectedParent },
        });
      fireEvent.click(screen.getByRole("button", { name: "Crear categoría" }));

      await waitFor(() =>
        expect(api.create).toHaveBeenCalledWith({
          display_name: "Accesorios",
          slug: "accesorios",
          description: null,
          parent_id: expectedParent,
        })
      );
    }
  );

  it("loads edit values and excludes itself and descendants as possible parents", () => {
    render(
      <CategoryFormDialog
        open
        onOpenChange={vi.fn()}
        categories={[root, child, grandchild]}
        category={child}
      />
    );
    expect(
      (screen.getByLabelText("Nombre visible") as HTMLInputElement).value
    ).toBe("Montaña");
    const options = Array.from(
      (screen.getByLabelText("Categoría padre") as HTMLSelectElement).options
    );
    expect(options.map((option) => option.value)).toEqual(["", "root"]);
  });
});
