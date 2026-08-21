import { getGetSaleOrderRequestUrl } from "@/lib/api/api";
import type {
  CreateSalesOrderRequest,
  ErrorResponse,
  SalesOrder,
  SalesOrderId,
} from "@/lib/api/schemas";

export async function updateSalesOrderRequest(
  id: SalesOrderId,
  payload: CreateSalesOrderRequest
) {
  const response = await fetch(getGetSaleOrderRequestUrl(id), {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.text();
  const data = body ? JSON.parse(body) : {};

  return {
    status: response.status,
    data: data as SalesOrder | ErrorResponse,
  };
}
