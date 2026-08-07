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

import {
  CustomerCreateForm,
  type CustomerFormValues,
} from "./customer-create-form";

describe("CustomerCreateForm", () => {
  afterEach(cleanup);

  it("validates required fields and minimum length", async () => {
    const onSubmit = vi
      .fn<() => Promise<string | null>>()
      .mockResolvedValue(null);
    render(<CustomerCreateForm onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Crear perfil" }));
    expect(await screen.findByText("El nombre es obligatorio.")).toBeTruthy();
    expect(screen.getByText("El RFC es obligatorio.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Nombre de la empresa"), {
      target: { value: "ab" },
    });
    fireEvent.blur(screen.getByLabelText("Nombre de la empresa"));
    expect(
      await screen.findByText("El nombre debe tener al menos 3 caracteres.")
    ).toBeTruthy();

    fireEvent.change(screen.getByLabelText("RFC"), {
      target: { value: "ab" },
    });
    fireEvent.blur(screen.getByLabelText("RFC"));
    expect(
      await screen.findByText("El RFC debe tener al menos 3 caracteres.")
    ).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("validates optional phone and email formats", async () => {
    const onSubmit = vi
      .fn<() => Promise<string | null>>()
      .mockResolvedValue(null);
    render(<CustomerCreateForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Teléfono"), {
      target: { value: "123" },
    });
    fireEvent.blur(screen.getByLabelText("Teléfono"));
    expect(
      await screen.findByText("El teléfono debe tener entre 10 y 15 dígitos.")
    ).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Correo Electrónico"), {
      target: { value: "no-es-correo" },
    });
    fireEvent.blur(screen.getByLabelText("Correo Electrónico"));
    expect(await screen.findByText("Ingresa un correo válido.")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits trimmed values", async () => {
    const onSubmit = vi
      .fn<(values: CustomerFormValues) => Promise<string | null>>()
      .mockResolvedValue(null);
    render(<CustomerCreateForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Nombre de la empresa"), {
      target: { value: "  Bicicletas del Norte  " },
    });
    fireEvent.change(screen.getByLabelText("RFC"), {
      target: { value: "  BIC123456789  " },
    });
    fireEvent.change(screen.getByLabelText("Teléfono"), {
      target: { value: "5512345678" },
    });
    fireEvent.change(screen.getByLabelText("Correo Electrónico"), {
      target: { value: "ventas@ejemplo.mx" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear perfil" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        company_name: "Bicicletas del Norte",
        tax_id: "BIC123456789",
        phone: "5512345678",
        email: "ventas@ejemplo.mx",
      })
    );
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows the submission error returned by the backend", async () => {
    const onSubmit = vi
      .fn<(values: CustomerFormValues) => Promise<string | null>>()
      .mockResolvedValue("El RFC ya está registrado.");
    render(<CustomerCreateForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Nombre de la empresa"), {
      target: { value: "Bicicletas del Norte" },
    });
    fireEvent.change(screen.getByLabelText("RFC"), {
      target: { value: "BIC123456789" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear perfil" }));

    expect(await screen.findByText("El RFC ya está registrado.")).toBeTruthy();
  });
});
