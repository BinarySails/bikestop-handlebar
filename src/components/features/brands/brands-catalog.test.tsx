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
  archive: vi.fn(),
  listMutate: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => api.navigate,
}));

vi.mock("@/lib/api/api", () => ({
  createBrandRequest: api.create,
  deleteBrandRequest: api.archive,
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
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("BrandsCatalog API container", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.create.mockResolvedValue({ status: 201, data: brandFixtures[0] });
    api.archive.mockResolvedValue({ status: 200, data: brandFixtures[0] });
    api.listMutate.mockResolvedValue(undefined);
  });
  afterEach(cleanup);

  it("debounces server search and resets the zero-based page", async () => {
    const onFiltersChange = vi.fn();
    render(
      <BrandsCatalog filters={{ page: 2 }} onFiltersChange={onFiltersChange} />
    );
    fireEvent.change(screen.getByLabelText("Buscar marcas"), {
      target: { value: "trek" },
    });
    expect(onFiltersChange).not.toHaveBeenCalled();
    await waitFor(
      () =>
        expect(onFiltersChange).toHaveBeenCalledWith({
          page: undefined,
          display_name: "trek",
        }),
      { timeout: 700 }
    );
  });

  it("shows active and archived brands in separate views", () => {
    render(<BrandsCatalog filters={{}} onFiltersChange={vi.fn()} />);
    expect(screen.getAllByText("Specialized").length).toBeGreaterThan(0);
    expect(screen.queryByText("Cannondale")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Mostrar archivadas" }));
    expect(screen.getAllByText("Cannondale").length).toBeGreaterThan(0);
    expect(screen.queryByText("Specialized")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Mostrar activas" }));
    expect(screen.getAllByText("Specialized").length).toBeGreaterThan(0);
    expect(screen.queryByText("Cannondale")).toBeNull();
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

  it("navigates to the brand edit page", async () => {
    render(<BrandsCatalog filters={{}} onFiltersChange={vi.fn()} />);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Acciones de Specialized" })[0]
    );
    fireEvent.click(await screen.findByText("Editar"));
    expect(api.navigate).toHaveBeenCalledWith({
      to: "/brands/$brandId/edit",
      params: { brandId: brandFixtures[0].id },
    });
  });

  it("navigates to the brand detail page", async () => {
    render(<BrandsCatalog filters={{}} onFiltersChange={vi.fn()} />);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Acciones de Specialized" })[0]
    );
    fireEvent.click(await screen.findByText("Ver detalle"));
    expect(api.navigate).toHaveBeenCalledWith({
      to: "/brands/$brandId",
      params: { brandId: brandFixtures[0].id },
    });
  });

  it("confirms archive before calling delete and refreshing", async () => {
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
