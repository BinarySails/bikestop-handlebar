// @vitest-environment jsdom
/* oxlint-disable vitest/require-mock-type-parameters */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { customerFixtures } from "./customer-fixtures";
import {
  CustomerSettingsCard,
  type CustomerField,
} from "./customer-settings-card";

describe("CustomerSettingsCard", () => {
  afterEach(cleanup);

  it("renders the current customer values", () => {
    render(
      <CustomerSettingsCard
        customer={customerFixtures[0]}
        onUpdateField={vi.fn()}
      />
    );
    expect(screen.getByText("Bicicletas del Norte")).toBeTruthy();
    expect(screen.getByText("BIC123456789")).toBeTruthy();
    expect(screen.getByText("5512345678")).toBeTruthy();
    expect(screen.getByText("ventas@bicicletasnorte.mx")).toBeTruthy();
  });

  it("validates required fields before saving", async () => {
    const onUpdateField = vi.fn<() => Promise<void>>().mockResolvedValue();
    render(
      <CustomerSettingsCard
        customer={customerFixtures[0]}
        onUpdateField={onUpdateField}
      />
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Modificar" })[0]);
    fireEvent.change(screen.getByLabelText("Nombre de la empresa"), {
      target: { value: "ab" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Guardar" })[0]);

    expect(
      await screen.findByText("Debe tener al menos 3 caracteres")
    ).toBeTruthy();
    expect(onUpdateField).not.toHaveBeenCalled();
  });

  it("saves a modified required field with the trimmed value", async () => {
    const onUpdateField = vi
      .fn<(field: CustomerField, value: string) => Promise<void>>()
      .mockResolvedValue();
    render(
      <CustomerSettingsCard
        customer={customerFixtures[0]}
        onUpdateField={onUpdateField}
      />
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Modificar" })[0]);
    fireEvent.change(screen.getByLabelText("Nombre de la empresa"), {
      target: { value: "  Bicicletas del Sur  " },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Guardar" })[0]);

    await waitFor(() =>
      expect(onUpdateField).toHaveBeenCalledWith(
        "company_name",
        "Bicicletas del Sur"
      )
    );
  });

  it("sends an empty value when an optional field is cleared", async () => {
    const onUpdateField = vi
      .fn<(field: CustomerField, value: string) => Promise<void>>()
      .mockResolvedValue();
    render(
      <CustomerSettingsCard
        customer={customerFixtures[0]}
        onUpdateField={onUpdateField}
      />
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Modificar" })[2]);
    fireEvent.change(screen.getByLabelText("Teléfono"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(onUpdateField).toHaveBeenCalledWith("phone", "")
    );
  });

  it("disables editing when disabled is set", () => {
    const onUpdateField = vi
      .fn<(field: CustomerField, value: string) => Promise<void>>()
      .mockResolvedValue();
    render(
      <CustomerSettingsCard
        customer={{ ...customerFixtures[0], status: "disable" }}
        onUpdateField={onUpdateField}
        disabled
      />
    );

    const modifyButtons = screen.getAllByRole("button", { name: "Modificar" });
    expect(modifyButtons.length).toBeGreaterThan(0);
    for (const button of modifyButtons) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }
  });
});
