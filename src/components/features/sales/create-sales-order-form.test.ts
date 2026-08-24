import { describe, expect, it } from "vitest";

import { validateWarehouseAllocations } from "./create-sales-order-form";

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
