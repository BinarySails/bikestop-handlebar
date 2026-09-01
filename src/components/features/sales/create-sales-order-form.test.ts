import { describe, expect, it } from "vitest";

import type { InventoryItemResponse } from "@/lib/api/schemas";

import {
  selectDefaultWarehouse,
  validateWarehouseAllocations,
} from "./create-sales-order-form";

function inventoryItem(
  warehouseId: string,
  availableQuantity: number
): InventoryItemResponse {
  return {
    available_quantity: availableQuantity,
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

describe("selectDefaultWarehouse", () => {
  it("selects the sufficient warehouse with the most available units", () => {
    expect(
      selectDefaultWarehouse(
        [
          inventoryItem("warehouse-a", 3),
          inventoryItem("warehouse-b", 8),
          inventoryItem("warehouse-c", 6),
        ],
        5
      )?.warehouse_id
    ).toBe("warehouse-b");
  });

  it("returns no warehouse when none can cover the line quantity", () => {
    expect(
      selectDefaultWarehouse(
        [inventoryItem("warehouse-a", 4), inventoryItem("warehouse-b", 9)],
        10
      )
    ).toBeUndefined();
  });

  it("keeps the first sufficient warehouse on ties", () => {
    expect(
      selectDefaultWarehouse(
        [inventoryItem("warehouse-a", 5), inventoryItem("warehouse-b", 5)],
        5
      )?.warehouse_id
    ).toBe("warehouse-a");
  });
});
