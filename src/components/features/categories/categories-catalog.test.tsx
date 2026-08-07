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

import { CategoriesCatalog } from "./categories-catalog";

const api = vi.hoisted(() => ({
  query: vi.fn(),
  mutate: vi.fn(),
}));

vi.mock("@/lib/api/api", () => ({
  useGetCategoriesRequest: api.query,
  createCategoryRequest: vi.fn(),
  updateCategoryRequest: vi.fn(),
  deleteCategoryRequest: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const root: Category = {
  id: "root",
  display_name: "Bicicletas",
  slug: "bicicletas",
  description: "Todas las bicicletas",
  parent_id: null,
  status: "active",
  created_at: "2026-01-01T00:00:00Z",
};
const child: Category = {
  id: "child",
  display_name: "Montaña",
  slug: "montana",
  description: null,
  parent_id: "root",
  status: "inactive",
  created_at: "2026-01-02T00:00:00Z",
};

function queryState(overrides: Record<string, unknown> = {}) {
  return {
    data: { status: 200, data: { categories: [root, child] } },
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: api.mutate,
    ...overrides,
  };
}

describe("CategoriesCatalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.query.mockReturnValue(queryState());
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders roots, parent names and statuses", () => {
    render(<CategoriesCatalog filters={{}} onFiltersChange={vi.fn()} />);
    expect(screen.getAllByText("Bicicletas")).toHaveLength(2);
    expect(screen.getByText("Montaña")).toBeTruthy();
    expect(screen.getByText("Sin categoría padre")).toBeTruthy();
    expect(screen.getByText("Inactiva")).toBeTruthy();
  });

  it("debounces search and keeps the filter controls focused on searching", async () => {
    const onFiltersChange = vi.fn();
    render(
      <CategoriesCatalog filters={{}} onFiltersChange={onFiltersChange} />
    );

    fireEvent.change(screen.getByLabelText("Buscar categorías"), {
      target: { value: "montaña" },
    });
    expect(onFiltersChange).not.toHaveBeenCalled();
    await waitFor(
      () =>
        expect(onFiltersChange).toHaveBeenCalledWith({
          display_name: "montaña",
        }),
      { timeout: 700 }
    );

    expect(screen.queryByLabelText("Ordenar categorías")).toBeNull();
    expect(screen.queryByRole("button", { name: /limpiar/i })).toBeNull();
  });

  it("renders parent rows before indented child rows", () => {
    render(<CategoriesCatalog filters={{}} onFiltersChange={vi.fn()} />);

    const rows = screen.getAllByRole("row");
    expect(rows[1]?.textContent).toContain("Bicicletas");
    expect(rows[2]?.textContent).toContain("Montaña");
    expect(screen.getByText("Nivel jerárquico 2")).toBeTruthy();
  });

  it("shows loading, empty and retryable error states", () => {
    api.query.mockReturnValue(queryState({ data: undefined, isLoading: true }));
    const { rerender } = render(
      <CategoriesCatalog filters={{}} onFiltersChange={vi.fn()} />
    );
    expect(screen.getByLabelText("Cargando categorías")).toBeTruthy();

    api.query.mockReturnValue(
      queryState({ data: { status: 200, data: { categories: [] } } })
    );
    rerender(<CategoriesCatalog filters={{}} onFiltersChange={vi.fn()} />);
    expect(screen.getByText("No hay categorías registradas.")).toBeTruthy();

    api.query.mockReturnValue(
      queryState({ data: undefined, error: new Error("network") })
    );
    rerender(<CategoriesCatalog filters={{}} onFiltersChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(api.mutate).toHaveBeenCalled();
  });
});
