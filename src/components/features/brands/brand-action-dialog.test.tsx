// @vitest-environment jsdom
/* oxlint-disable vitest/require-mock-type-parameters */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BrandActionDialog } from "./brand-action-dialog";
import { brandFixtures } from "./brand-fixtures";

describe("BrandActionDialog", () => {
  afterEach(cleanup);

  it("confirms activation and deactivation with the brand name", () => {
    const confirm = vi.fn();
    const { rerender } = render(
      <BrandActionDialog
        brand={brandFixtures[0]}
        action="toggle"
        onOpenChange={vi.fn()}
        onConfirm={confirm}
      />
    );
    expect(screen.getByText(/desactivar “Specialized”/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Desactivar marca" }));
    expect(confirm).toHaveBeenCalledTimes(1);

    rerender(
      <BrandActionDialog
        brand={brandFixtures[1]}
        action="toggle"
        onOpenChange={vi.fn()}
        onConfirm={confirm}
      />
    );
    expect(screen.getByRole("button", { name: "Activar marca" })).toBeTruthy();
  });

  it("uses archive language and blocks incompatible archived actions", () => {
    const { rerender } = render(
      <BrandActionDialog
        brand={brandFixtures[0]}
        action="archive"
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText(/se marcará como archivada/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Archivar marca" })).toBeTruthy();

    rerender(
      <BrandActionDialog
        brand={brandFixtures[2]}
        action="toggle"
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Desactivar marca",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  });
});
