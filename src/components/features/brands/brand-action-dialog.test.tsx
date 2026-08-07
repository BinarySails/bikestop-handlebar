// @vitest-environment jsdom
/* oxlint-disable vitest/require-mock-type-parameters */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BrandActionDialog } from "./brand-action-dialog";
import { brandFixtures } from "./brand-fixtures";

describe("BrandActionDialog", () => {
  afterEach(cleanup);

  it("confirms archive with the brand name", () => {
    const confirm = vi.fn();
    render(
      <BrandActionDialog
        brand={brandFixtures[0]}
        onOpenChange={vi.fn()}
        onConfirm={confirm}
      />
    );

    expect(
      screen.getByText(/“Specialized” se marcará como archivada/)
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Archivar marca" }));
    expect(confirm).toHaveBeenCalledOnce();
  });

  it("does not allow archiving an already archived brand", () => {
    render(
      <BrandActionDialog
        brand={brandFixtures[2]}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(
      (
        screen.getByRole("button", {
          name: "Archivar marca",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  });
});
