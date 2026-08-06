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
    order: undefined,
    onSearchChange: vi.fn(),
    onOrderChange: vi.fn(),
    onLimitChange: vi.fn(),
    onPageChange: vi.fn(),
    onClearFilters: vi.fn(),
    onRetry: vi.fn(),
    onCreate: vi.fn(),
    onView: vi.fn(),
    onEdit: vi.fn(),
    onToggle: vi.fn(),
    onArchive: vi.fn(),
    ...overrides,
  };
}

describe("BrandsCatalogView visual phase", () => {
  afterEach(cleanup);

  it("renders enable, disable and archive states with mocked brands", () => {
    render(<BrandsCatalogView {...props()} />);
    expect(screen.getAllByText("Activa").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Desactivada").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Archivada").length).toBeGreaterThan(0);
  });

  it("shows a stable fallback when an image fails", () => {
    render(<BrandImage src="https://invalid.example/logo.png" alt="Rota" />);
    fireEvent.error(screen.getByRole("img", { name: "Logotipo de Rota" }));
    expect(screen.getByText("Imagen no disponible para Rota")).toBeTruthy();
  });

  it("exposes controlled search, ordering and limit callbacks", () => {
    const viewProps = props();
    render(<BrandsCatalogView {...viewProps} />);
    fireEvent.change(screen.getByLabelText("Buscar marcas"), {
      target: { value: "trek" },
    });
    fireEvent.change(screen.getByLabelText("Ordenar marcas"), {
      target: { value: "desc" },
    });
    fireEvent.change(screen.getByLabelText("Resultados por página"), {
      target: { value: "20" },
    });
    expect(viewProps.onSearchChange).toHaveBeenCalledWith("trek");
    expect(viewProps.onOrderChange).toHaveBeenCalledWith("desc");
    expect(viewProps.onLimitChange).toHaveBeenCalledWith(20);
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
