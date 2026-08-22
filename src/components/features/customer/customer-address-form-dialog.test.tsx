// @vitest-environment jsdom
/* oxlint-disable vitest/require-mock-type-parameters */

import type { Mock } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { CustomerAddressFormDialog } from "./customer-address-form-dialog";

const createTriggerMock = vi.fn<(...args: unknown[]) => unknown>();
const updateTriggerMock = vi.fn<(...args: unknown[]) => unknown>();

vi.mock("@/lib/api/api", () => ({
  useCreateCustomerAddressRequest: () => ({ trigger: createTriggerMock }),
  useUpdateCustomerAddressRequest: () => ({ trigger: updateTriggerMock }),
  useListStatesRequest: () => ({
    data: {
      status: 200,
      data: [{ id: "state-1", display_name: "Jalisco", created_at: "" }],
    },
    isLoading: false,
  }),
  useListLocalitiesRequest: () => ({
    data: {
      status: 200,
      data: {
        data: [
          {
            id: "locality-1",
            state_id: "state-1",
            display_name: "Guadalajara",
            created_at: "",
          },
        ],
      },
    },
    isLoading: false,
  }),
}));

vi.mock("sonner", () => {
  const error = vi.fn<(...args: unknown[]) => unknown>();
  const success = vi.fn<(...args: unknown[]) => unknown>();
  return { toast: { error, success } };
});

const notifications = {
  error: vi.mocked(toast.error as Mock),
  success: vi.mocked(toast.success as Mock),
};

function openDialog() {
  render(
    <CustomerAddressFormDialog
      userId="user-1"
      mode="create"
      trigger={<button type="button">Agregar dirección</button>}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "Agregar dirección" }));
}

async function chooseOption(labelText: string, optionText: string) {
  fireEvent.click(screen.getByLabelText(labelText));
  const option = await screen.findByRole("option", { name: optionText });
  fireEvent.click(option);
}

async function fillValidForm() {
  fireEvent.change(screen.getByLabelText("Nombre de contacto"), {
    target: { value: "Juan Perez" },
  });
  fireEvent.change(screen.getByLabelText("Teléfono"), {
    target: { value: "5512345678" },
  });
  await chooseOption("Estado", "Jalisco");
  await chooseOption("Ciudad", "Guadalajara");

  fireEvent.change(screen.getByLabelText("Código postal"), {
    target: { value: "44100" },
  });
  fireEvent.change(screen.getByLabelText("Calle y número"), {
    target: { value: "Av. Vallarta 1234" },
  });
}

describe("CustomerAddressFormDialog", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows required validation errors without calling the API", async () => {
    openDialog();
    fireEvent.click(screen.getByRole("button", { name: "Agregar dirección" }));

    expect(
      await screen.findByText("El nombre de contacto es obligatorio")
    ).toBeTruthy();
    expect(
      screen.getByText("El teléfono es obligatorio")
    ).toBeTruthy();
    expect(createTriggerMock).not.toHaveBeenCalled();
  });

  it("creates an address with the selected state and city", async () => {
    createTriggerMock.mockResolvedValue({
      status: 201,
      data: { id: "address-1" },
    });
    openDialog();
    await fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: "Agregar dirección" }));

    await waitFor(() =>
      expect(createTriggerMock).toHaveBeenCalledWith({
        contact_name: "Juan Perez",
        phone: "5512345678",
        country: "México",
        state: "Jalisco",
        city: "Guadalajara",
        postal_code: "44100",
        address: "Av. Vallarta 1234",
      })
    );
    expect(notifications.success).toHaveBeenCalledWith("Dirección agregada");
  });

  it("shows a translated error when the state does not exist", async () => {
    createTriggerMock.mockResolvedValue({
      status: 404,
      data: { type: "error", message: "state not found" },
    });
    openDialog();
    await fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: "Agregar dirección" }));

    await waitFor(() =>
      expect(notifications.error).toHaveBeenCalledWith(
        "El estado seleccionado no existe"
      )
    );
  });
});
