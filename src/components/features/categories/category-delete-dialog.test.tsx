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

import { CategoryDeleteDialog } from "./category-delete-dialog";

const api = vi.hoisted(() => ({
  remove: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  deleted: vi.fn<() => Promise<void>>(),
}));

vi.mock("@/lib/api/api", () => ({
  deleteCategoryRequest: api.remove,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const parent: Category = {
  id: "parent",
  display_name: "Bicicletas",
  slug: "bicicletas",
  description: null,
  parent_id: null,
  status: "enable",
  created_at: "2026-01-01T00:00:00Z",
};
const child: Category = {
  ...parent,
  id: "child",
  display_name: "Montaña",
  slug: "montana",
  parent_id: "parent",
};

describe("CategoryDeleteDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.remove.mockResolvedValue({ status: 200, data: { id: "parent" } });
    api.deleted.mockResolvedValue();
  });
  afterEach(cleanup);

  it("names the category, warns about loaded children and requires confirmation", async () => {
    const onOpenChange = vi.fn();
    render(
      <CategoryDeleteDialog
        category={parent}
        categories={[parent, child]}
        onOpenChange={onOpenChange}
        onDeleted={api.deleted}
      />
    );

    expect(screen.getByText(/Esta acción eliminará “Bicicletas”/)).toBeTruthy();
    expect(screen.getByText(/1 hija directa/)).toBeTruthy();
    expect(api.remove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar categoría" }));
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith("parent"));
    expect(api.deleted).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
