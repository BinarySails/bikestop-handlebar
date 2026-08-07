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

import { brandFixtures } from "./brand-fixtures";
import { BrandFormDialog } from "./brand-form-dialog";

vi.mock("./image-upload-field", () => ({
  ImageUploadField: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
  }) => (
    <div>
      <button
        type="button"
        aria-label={label}
        onClick={() => onChange("https://example.com/uploaded.png")}
      >
        Seleccionar imagen
      </button>
      <output data-testid="image-url">{value}</output>
    </div>
  ),
}));

describe("BrandFormDialog visual phase", () => {
  afterEach(cleanup);

  it("validates required name and image fields", async () => {
    const onSubmit = vi.fn<() => Promise<void>>();
    render(<BrandFormDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Crear marca" }));
    expect(await screen.findByText("El nombre es obligatorio.")).toBeTruthy();
    expect(
      screen.getByText("La URL de la imagen es obligatoria.")
    ).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Nombre visible"), {
      target: { value: "ab" },
    });
    fireEvent.blur(screen.getByLabelText("Nombre visible"));
    expect(
      await screen.findByText("El nombre debe tener al menos 3 caracteres.")
    ).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits creation values once and shows an image preview", async () => {
    const onSubmit = vi
      .fn<
        (values: { display_name: string; image_url: string }) => Promise<void>
      >()
      .mockResolvedValue();
    render(<BrandFormDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Nombre visible"), {
      target: { value: "  Giant  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Imagen de la marca" }));
    fireEvent.click(screen.getByRole("button", { name: "Crear marca" }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        display_name: "Giant",
        image_url: "https://example.com/uploaded.png",
      })
    );
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("loads values for editing", () => {
    render(
      <BrandFormDialog
        open
        brand={brandFixtures[0]}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(
      (screen.getByLabelText("Nombre visible") as HTMLInputElement).value
    ).toBe("Specialized");
    expect(screen.getByTestId("image-url").textContent).toBe(
      brandFixtures[0].image_url
    );
    expect(
      screen.getByRole("button", { name: "Guardar cambios" })
    ).toBeTruthy();
  });
});
