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

import type { CustomerAddressWithAddressRow } from "@/lib/api/schemas";
import { CustomerAddressList } from "./customer-address-list";

vi.mock("sonner", () => {
  const error = vi.fn<(...args: unknown[]) => unknown>();
  const success = vi.fn<(...args: unknown[]) => unknown>();
  return { toast: { error, success } };
});

const deleteTriggerMock = vi.fn<(...args: unknown[]) => unknown>();
const setDefaultShippingTriggerMock = vi.fn<(...args: unknown[]) => unknown>();
const setDefaultBillingTriggerMock = vi.fn<(...args: unknown[]) => unknown>();

vi.mock("@/lib/api/api", () => ({
  useDeleteCustomerAddressRequest: () => ({ trigger: deleteTriggerMock }),
  useSetDefaultShippingAddressRequest: () => ({
    trigger: setDefaultShippingTriggerMock,
  }),
  useSetDefaultBillingAddressRequest: () => ({
    trigger: setDefaultBillingTriggerMock,
  }),
  useCreateCustomerAddressRequest: () => ({ trigger: vi.fn() }),
  useUpdateCustomerAddressRequest: () => ({ trigger: vi.fn() }),
  useListStatesRequest: () => ({
    data: { status: 200, data: [] },
    isLoading: false,
  }),
}));

const notifications = {
  error: vi.mocked(toast.error as Mock),
  success: vi.mocked(toast.success as Mock),
};

function address(
  overrides: Partial<CustomerAddressWithAddressRow> = {}
): CustomerAddressWithAddressRow {
  return {
    id: "address-1",
    customer_id: "customer-1",
    contact_name: "Juan Perez",
    phone: "5512345678",
    is_default_shipping: false,
    is_default_billing: false,
    status: "enable",
    created_at: "",
    updated_at: "",
    address_id: "raw-address-1",
    country: "Mexico",
    state: "Jalisco",
    city: "Guadalajara",
    postal_code: "44100",
    street_address: "Av. Vallarta 1234",
    address_created_at: "",
    ...overrides,
  };
}

describe("CustomerAddressList", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an empty state when there are no addresses", () => {
    render(
      <CustomerAddressList userId="user-1" addresses={[]} onChanged={vi.fn()} />
    );
    expect(
      screen.getByText("Aún no tienes direcciones registradas.")
    ).toBeTruthy();
  });

  it("renders the address details and default badges", () => {
    render(
      <CustomerAddressList
        userId="user-1"
        addresses={[address({ is_default_shipping: true })]}
        onChanged={vi.fn()}
      />
    );

    expect(screen.getByText("Juan Perez")).toBeTruthy();
    expect(screen.getByText("5512345678")).toBeTruthy();
    expect(
      screen.getByText("Av. Vallarta 1234, Guadalajara, Jalisco, 44100, Mexico")
    ).toBeTruthy();
    expect(screen.getByText("Envío predeterminado")).toBeTruthy();
    expect(screen.getByText("Facturación predeterminada")).toBeTruthy();
  });

  it("keeps the default badges in place but disabled once active", () => {
    render(
      <CustomerAddressList
        userId="user-1"
        addresses={[address({ is_default_shipping: true })]}
        onChanged={vi.fn()}
      />
    );

    const shippingBadge = screen.getByRole("button", {
      name: "Envío predeterminado",
    }) as HTMLButtonElement;
    const billingBadge = screen.getByRole("button", {
      name: "Facturación predeterminada",
    }) as HTMLButtonElement;

    expect(shippingBadge.disabled).toBe(true);
    expect(billingBadge.disabled).toBe(false);
  });

  it("marks an address as the default shipping address by clicking its badge", async () => {
    setDefaultShippingTriggerMock.mockResolvedValue({
      status: 200,
      data: address({ is_default_shipping: true }),
    });
    const onChanged = vi.fn();
    render(
      <CustomerAddressList
        userId="user-1"
        addresses={[address()]}
        onChanged={onChanged}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Envío predeterminado" })
    );

    await waitFor(() =>
      expect(setDefaultShippingTriggerMock).toHaveBeenCalled()
    );
    expect(onChanged).toHaveBeenCalled();
    expect(notifications.success).toHaveBeenCalledWith(
      "Dirección marcada como envío predeterminado"
    );
  });

  it("deletes an address after confirmation", async () => {
    deleteTriggerMock.mockResolvedValue({ status: 200, data: address() });
    const onChanged = vi.fn();
    render(
      <CustomerAddressList
        userId="user-1"
        addresses={[address()]}
        onChanged={onChanged}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Eliminar dirección" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(deleteTriggerMock).toHaveBeenCalled());
    expect(onChanged).toHaveBeenCalled();
    expect(notifications.success).toHaveBeenCalledWith("Dirección eliminada");
  });

  it("shows a translated error when deleting fails", async () => {
    deleteTriggerMock.mockResolvedValue({
      status: 404,
      data: { type: "error", message: "address not found" },
    });
    render(
      <CustomerAddressList
        userId="user-1"
        addresses={[address()]}
        onChanged={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Eliminar dirección" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() =>
      expect(notifications.error).toHaveBeenCalledWith(
        "No se encontró la dirección"
      )
    );
  });
});
