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

import { brandFixtures } from "./brand-fixtures";
import { BrandsCatalog } from "./brands-catalog";

const api = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  archive: vi.fn(),
  toggle: vi.fn(),
  listMutate: vi.fn(),
  detailMutate: vi.fn(),
}));

vi.mock("@/lib/api/api", () => ({
  createBrandRequest: api.create,
  updateBrandRequest: api.update,
  deleteBrandRequest: api.archive,
  toggleBrandRequest: api.toggle,
  useListBrandsRequest: () => ({
    data: {
      status: 200,
      data: { data: brandFixtures, page: 0, limit: 10, total: 3 },
    },
    isLoading: false,
    isValidating: false,
    error: undefined,
    mutate: api.listMutate,
  }),
  useGetBrandRequest: () => ({
    data: undefined,
    isLoading: false,
    error: undefined,
    mutate: api.detailMutate,
  }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("BrandsCatalog API container", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.create.mockResolvedValue({ status: 201, data: brandFixtures[0] });
    api.update.mockResolvedValue({ status: 200, data: brandFixtures[0] });
    api.toggle.mockResolvedValue({ status: 200, data: brandFixtures[0] });
    api.archive.mockResolvedValue({ status: 200, data: brandFixtures[0] });
    api.listMutate.mockResolvedValue(undefined);
  });
  afterEach(cleanup);

  it("debounces server search and resets the zero-based page", async () => {
    const onFiltersChange = vi.fn();
    render(
      <BrandsCatalog
        filters={{ page: 2, limit: 10 }}
        onFiltersChange={onFiltersChange}
      />
    );
    fireEvent.change(screen.getByLabelText("Buscar marcas"), {
      target: { value: "trek" },
    });
    expect(onFiltersChange).not.toHaveBeenCalled();
    await waitFor(
      () =>
        expect(onFiltersChange).toHaveBeenCalledWith({
          page: undefined,
          limit: 10,
          display_name: "trek",
        }),
      { timeout: 700 }
    );
  });

  it("creates a brand and invalidates the list", async () => {
    render(<BrandsCatalog filters={{}} onFiltersChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Crear marca" }));
    fireEvent.change(screen.getByLabelText("Nombre visible"), {
      target: { value: "Giant" },
    });
    fireEvent.change(screen.getByLabelText("URL de la imagen"), {
      target: { value: "https://example.com/giant.png" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear marca" }));
    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({
        display_name: "Giant",
        image_url: "https://example.com/giant.png",
      })
    );
    expect(api.listMutate).toHaveBeenCalled();
  });

  it("maps a duplicate-name conflict to the name field", async () => {
    api.create.mockResolvedValue({
      status: 409,
      data: { type: "conflict", message: "duplicate" },
    });
    render(<BrandsCatalog filters={{}} onFiltersChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Crear marca" }));
    fireEvent.change(screen.getByLabelText("Nombre visible"), {
      target: { value: "Trek" },
    });
    fireEvent.change(screen.getByLabelText("URL de la imagen"), {
      target: { value: "https://example.com/trek.png" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear marca" }));
    expect(
      await screen.findByText("Ya existe una marca con este nombre.")
    ).toBeTruthy();
  });

  it("edits a brand and invalidates the catalog", async () => {
    render(<BrandsCatalog filters={{}} onFiltersChange={vi.fn()} />);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Acciones de Specialized" })[0]
    );
    fireEvent.click(await screen.findByText("Editar"));
    fireEvent.change(screen.getByLabelText("Nombre visible"), {
      target: { value: "Specialized México" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith(brandFixtures[0].id, {
        display_name: "Specialized México",
        image_url: brandFixtures[0].image_url,
      })
    );
    expect(api.listMutate).toHaveBeenCalled();
  });

  it("confirms toggle and archive operations before invalidating", async () => {
    const { unmount } = render(
      <BrandsCatalog filters={{}} onFiltersChange={vi.fn()} />
    );
    fireEvent.click(
      screen.getAllByRole("button", { name: "Acciones de Specialized" })[0]
    );
    fireEvent.click(await screen.findByText("Desactivar"));
    fireEvent.click(screen.getByRole("button", { name: "Desactivar marca" }));
    await waitFor(() =>
      expect(api.toggle).toHaveBeenCalledWith(brandFixtures[0].id)
    );
    expect(api.listMutate).toHaveBeenCalled();

    unmount();
    vi.clearAllMocks();
    render(<BrandsCatalog filters={{}} onFiltersChange={vi.fn()} />);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Acciones de Specialized" })[0]
    );
    fireEvent.click(await screen.findByText("Archivar"));
    fireEvent.click(screen.getByRole("button", { name: "Archivar marca" }));
    await waitFor(() =>
      expect(api.archive).toHaveBeenCalledWith(brandFixtures[0].id)
    );
    expect(api.listMutate).toHaveBeenCalled();
  });
});
