// @vitest-environment jsdom
/* oxlint-disable vitest/require-mock-type-parameters */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { brandFixtures } from "./brand-fixtures";
import { BrandImage } from "./brand-image";
import {
  BrandsCatalogView,
  getBrandPageCount,
  type BrandsCatalogViewProps,
} from "./brands-catalog-view";

function props(
  overrides: Partial<BrandsCatalogViewProps> = {}
): BrandsCatalogViewProps {
  return {
    brands: brandFixtures,
    page: 0,
    limit: 10,
    total: 23,
    search: "",
    archivedOnly: false,
    onSearchChange: vi.fn(),
    onArchivedOnlyChange: vi.fn(),
    onPageChange: vi.fn(),
    onRetry: vi.fn(),
    onCreate: vi.fn(),
    onView: vi.fn(),
    onArchive: vi.fn(),
    ...overrides,
  };
}

describe("BrandsCatalogView visual phase", () => {
  afterEach(cleanup);

  it("renders brands prominently without status or creation columns", () => {
    render(<BrandsCatalogView {...props()} />);
    expect(screen.getAllByText("Specialized").length).toBeGreaterThan(0);
    expect(screen.queryByRole("columnheader", { name: "Estado" })).toBeNull();
    expect(screen.queryByRole("columnheader", { name: "Creación" })).toBeNull();
  });

  it("shows a stable fallback when an image fails", () => {
    render(<BrandImage src="https://invalid.example/logo.png" alt="Rota" />);
    fireEvent.error(screen.getByRole("img", { name: "Logotipo de Rota" }));
    expect(screen.getByText("Imagen no disponible para Rota")).toBeTruthy();
  });

  it("exposes the controlled search callback without extra filters", () => {
    const viewProps = props();
    render(<BrandsCatalogView {...viewProps} />);
    fireEvent.change(screen.getByLabelText("Buscar marcas"), {
      target: { value: "trek" },
    });
    expect(viewProps.onSearchChange).toHaveBeenCalledWith("trek");
    expect(screen.queryByLabelText("Ordenar marcas")).toBeNull();
    expect(screen.queryByLabelText("Resultados por página")).toBeNull();
    expect(screen.queryByRole("button", { name: "Limpiar" })).toBeNull();
  });

  it("switches to the archived-only view", () => {
    const viewProps = props();
    render(<BrandsCatalogView {...viewProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Mostrar archivadas" }));
    expect(viewProps.onArchivedOnlyChange).toHaveBeenCalledWith(true);
  });

  it("shows archived status only in the archived view", () => {
    const { rerender } = render(<BrandsCatalogView {...props()} />);
    expect(screen.queryByText("Archivada")).toBeNull();

    rerender(<BrandsCatalogView {...props({ archivedOnly: true })} />);
    expect(screen.getAllByText("Archivada").length).toBeGreaterThan(0);
  });

  it("uses zero-based page callbacks for first, middle and last pages", () => {
    const middle = props({ page: 1 });
    const { rerender } = render(<BrandsCatalogView {...middle} />);
    fireEvent.click(screen.getByRole("button", { name: /Anterior/ }));
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
    expect(middle.onPageChange).toHaveBeenNthCalledWith(1, 0);
    expect(middle.onPageChange).toHaveBeenNthCalledWith(2, 2);

    rerender(<BrandsCatalogView {...props({ page: 0 })} />);
    expect(
      (screen.getByRole("button", { name: /Anterior/ }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
    rerender(<BrandsCatalogView {...props({ page: 2 })} />);
    expect(
      (screen.getByRole("button", { name: /Siguiente/ }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
    expect(getBrandPageCount(23, 10)).toBe(3);
  });

  it("renders loading, error, empty and no-search-results states", () => {
    const { rerender } = render(
      <BrandsCatalogView {...props({ loading: true })} />
    );
    expect(screen.getByLabelText("Cargando marcas")).toBeTruthy();
    const retry = vi.fn();
    rerender(
      <BrandsCatalogView
        {...props({
          brands: [],
          total: 0,
          error: "Intenta nuevamente",
          onRetry: retry,
        })}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(retry).toHaveBeenCalled();
    rerender(<BrandsCatalogView {...props({ brands: [], total: 0 })} />);
    expect(screen.getByText("No hay marcas registradas.")).toBeTruthy();
    rerender(
      <BrandsCatalogView {...props({ brands: [], total: 0, search: "xyz" })} />
    );
    expect(
      screen.getByText("No encontramos marcas para esta búsqueda.")
    ).toBeTruthy();
  });
});
