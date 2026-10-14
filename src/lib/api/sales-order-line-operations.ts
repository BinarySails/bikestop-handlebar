import type {
  CreateSalesOrderLineRequest,
  SalesOrderLine,
  SalesOrderLineId,
  SalesOrderLineOperation,
} from "@/lib/api/schemas";

type SalesOrderLineValue = Omit<CreateSalesOrderLineRequest, "line_id">;

function normalizedAllocations(
  allocations?: { warehouse_id: string; quantity: number }[]
) {
  return [...(allocations ?? [])]
    .map(({ warehouse_id, quantity }) => ({ warehouse_id, quantity }))
    .sort((a, b) => a.warehouse_id.localeCompare(b.warehouse_id));
}

function lineIsUnchanged(
  original: SalesOrderLine,
  next: SalesOrderLineValue
): boolean {
  return (
    original.variant_id === next.variant_id &&
    original.description === next.description &&
    original.quantity === next.quantity &&
    original.unit_price === next.unit_price &&
    original.tax_rate === next.tax_rate &&
    JSON.stringify(normalizedAllocations(original.warehouse_allocations)) ===
      JSON.stringify(normalizedAllocations(next.warehouse_allocations))
  );
}

export function buildSalesOrderLineOperations(
  currentLines: SalesOrderLine[],
  nextLines: CreateSalesOrderLineRequest[]
): SalesOrderLineOperation[] {
  const currentById = new Map(currentLines.map((line) => [line.id, line]));
  const retainedIds = new Set<SalesOrderLineId>();
  const additions: SalesOrderLineOperation[] = [];
  const updates: SalesOrderLineOperation[] = [];

  for (const { line_id: lineId, ...line } of nextLines) {
    if (!lineId) {
      additions.push({ operation: "add", line });
      continue;
    }

    retainedIds.add(lineId);
    const current = currentById.get(lineId);
    if (!current || lineIsUnchanged(current, line)) continue;
      updates.push({ operation: "update", line_id: lineId, line });
  }

  const removals = currentLines
    .filter((line) => !retainedIds.has(line.id))
    .map((line) => ({ operation: "remove" as const, line_id: line.id }));

  // Remove first so replacing a product can release uniqueness constraints
  // before the replacement line is added.
  return [...removals, ...updates, ...additions];
}
