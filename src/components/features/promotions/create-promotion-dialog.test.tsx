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

import { CreatePromotionDialog } from "./create-promotion-dialog";

const api = vi.hoisted(() => ({
  create: vi.fn(),
}));

vi.mock("@/lib/api/api", () => ({
  createPromotionRequest: api.create,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("CreatePromotionDialog", () => {
  afterEach(cleanup);

  it("walks through the two-step wizard and submits a mapped payload", async () => {
    api.create.mockResolvedValue({
      status: 201,
      data: { code: "PRUEBA10" },
    });
    const onOpenChange = vi.fn();
    const onSaved = vi.fn();

    render(
      <CreatePromotionDialog
        open
        onOpenChange={onOpenChange}
        onSaved={onSaved}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Descuento de monto en la orden/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    fireEvent.change(screen.getByLabelText("Código"), {
      target: { value: "PRUEBA10" },
    });
    fireEvent.change(screen.getByLabelText("Monto de descuento"), {
      target: { value: "50" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear promoción" }));

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({
        code: "PRUEBA10",
        is_automatic: false,
        status: "active",
        starts_at: null,
        ends_at: null,
        usage_limit: null,
        stacking: "not_combinable",
        rules: [],
        application_method: {
          Standard: {
            target: "order",
            value: { fixed_amount: [5000, "MXN"] },
            target_rules: [],
            allocation: null,
            max_quantity: null,
          },
        },
      })
    );
    expect(onSaved).toHaveBeenCalled();
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("maps a duplicate code conflict back to the code field", async () => {
    api.create.mockResolvedValue({
      status: 409,
      data: { type: "conflict", message: "promotion code already exists" },
    });

    render(
      <CreatePromotionDialog open onOpenChange={vi.fn()} onSaved={vi.fn()} />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Descuento de monto en la orden/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    fireEvent.change(screen.getByLabelText("Código"), {
      target: { value: "PRUEBA10" },
    });
    fireEvent.change(screen.getByLabelText("Monto de descuento"), {
      target: { value: "50" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear promoción" }));

    expect(
      await screen.findByText("Ya existe una promoción con este código.")
    ).toBeTruthy();
  });

  it("shows the date selectors only when dated is enabled", () => {
    render(
      <CreatePromotionDialog open onOpenChange={vi.fn()} onSaved={vi.fn()} />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Descuento de monto en la orden/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(
      screen.getByText(
        "Sin fechas: la promoción estará vigente por tiempo indefinido."
      )
    ).toBeTruthy();
    expect(screen.queryByText("Fecha de inicio")).toBeNull();

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Programar fechas de vigencia",
      })
    );

    expect(screen.getByText("Fecha de inicio")).toBeTruthy();
    expect(screen.getByText("Fecha de fin")).toBeTruthy();
    expect(
      screen.queryByText(
        "Sin fechas: la promoción estará vigente por tiempo indefinido."
      )
    ).toBeNull();
  });

  it("hides the code field and sends an AUTO code when method is automatic", async () => {
    api.create.mockResolvedValue({
      status: 201,
      data: { code: "AUTO123" },
    });
    const onOpenChange = vi.fn();
    const onSaved = vi.fn();

    render(
      <CreatePromotionDialog
        open
        onOpenChange={onOpenChange}
        onSaved={onSaved}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Descuento de monto en la orden/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    fireEvent.click(screen.getByLabelText("Método"));
    const automaticOption = await screen.findByRole("option", {
      name: "Automática",
    });
    fireEvent.pointerDown(automaticOption);
    fireEvent.click(automaticOption);

    expect(screen.queryByLabelText("Código")).toBeNull();
    expect(
      screen.getByText("Se generará automáticamente un código único.")
    ).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Monto de descuento"), {
      target: { value: "50" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear promoción" }));

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith(
        expect.objectContaining({
          code: expect.stringMatching(/^AUTO\d+$/),
          is_automatic: true,
        })
      )
    );
    expect(onSaved).toHaveBeenCalled();
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
