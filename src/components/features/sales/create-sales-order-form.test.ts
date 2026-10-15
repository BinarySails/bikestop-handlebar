import { describe, expect, it } from "vitest";

import type { InventoryItemResponse } from "@/lib/api/schemas";

import {
  collectNewCustomerAddresses,
  selectManuallySelectableWarehouses,
  validateWarehouseAllocations,
} from "./create-sales-order-form";

function inventoryItem(
  warehouseId: string,
  availableQuantity: number,
  pickingMode: InventoryItemResponse["picking_mode"] = "automatic"
): InventoryItemResponse {
  return {
    available_quantity: availableQuantity,
    picking_mode: pickingMode,
    reserved_quantity: 0,
    total_quantity: availableQuantity,
    variant_id: "variant-a",
    variant_image_url: "",
    variant_name: "Variant A",
    variant_sku: "VAR-A",
    warehouse_id: warehouseId,
    warehouse_name: warehouseId,
  };
}

describe("validateWarehouseAllocations", () => {
  it("accepts allocations whose sum matches the line quantity", () => {
    expect(
      validateWarehouseAllocations("5", [
        { warehouse_id: "warehouse-a", quantity: "3" },
        { warehouse_id: "warehouse-b", quantity: "2" },
      ])
    ).toBeUndefined();
  });

  it("requires at least one allocation", () => {
    expect(validateWarehouseAllocations("5", [])).toBe(
      "Asigna al menos un almacén."
    );
  });

  it("rejects duplicate warehouses", () => {
    expect(
      validateWarehouseAllocations("5", [
        { warehouse_id: "warehouse-a", quantity: "3" },
        { warehouse_id: "warehouse-a", quantity: "2" },
      ])
    ).toBe("No se permiten almacenes repetidos.");
  });

  it("rejects non-positive allocation quantities", () => {
    expect(
      validateWarehouseAllocations("5", [
        { warehouse_id: "warehouse-a", quantity: "0" },
      ])
    ).toBe("Cada cantidad asignada debe ser un entero mayor que cero.");
  });

  it("rejects allocations whose sum differs from the line quantity", () => {
    expect(
      validateWarehouseAllocations("5", [
        { warehouse_id: "warehouse-a", quantity: "3" },
      ])
    ).toBe(
      "La cantidad asignada (3) debe coincidir con la cantidad de la línea (5)."
    );
  });
});

const billing = {
  country: "México",
  state: "Jalisco",
  city: "Guadalajara",
  postal_code: "44100",
  address: "Av. Vallarta 1234",
};

const shipping = {
  country: "México",
  state: "Jalisco",
  city: "Zapopan",
  postal_code: "45010",
  address: "Av. Patria 500",
};

describe("collectNewCustomerAddresses", () => {
  it("collects the billing address when it is new", () => {
    expect(
      collectNewCustomerAddresses(billing, shipping, true, true, false)
    ).toEqual([billing]);
  });

  it("collects the shipping address only when it differs from billing", () => {
    expect(
      collectNewCustomerAddresses(billing, shipping, false, false, true)
    ).toEqual([shipping]);
  });

  it("collects both new and distinct addresses", () => {
    expect(
      collectNewCustomerAddresses(billing, shipping, false, true, true)
    ).toEqual([billing, shipping]);
  });

  it("dedupes shipping when it matches billing", () => {
    expect(
      collectNewCustomerAddresses(billing, { ...billing }, false, true, true)
    ).toEqual([billing]);
  });

  it("ignores shipping when it is the same as billing", () => {
    expect(
      collectNewCustomerAddresses(billing, billing, true, true, true)
    ).toEqual([billing]);
  });

  it("returns no addresses when both selections are existing", () => {
    expect(
      collectNewCustomerAddresses(billing, shipping, false, false, false)
    ).toEqual([]);
  });
});

describe("selectManuallySelectableWarehouses", () => {
  it("allows manual and automatic warehouses but excludes restricted ones", () => {
    expect(
      selectManuallySelectableWarehouses([
        inventoryItem("warehouse-a", 4, "automatic"),
        inventoryItem("warehouse-b", 2, "manual"),
        inventoryItem("warehouse-c", 10, "restricted"),
      ]).map((warehouse) => warehouse.warehouse_id)
    ).toEqual(["warehouse-a", "warehouse-b"]);
  });
});
