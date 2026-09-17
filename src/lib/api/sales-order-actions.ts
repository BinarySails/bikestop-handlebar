import { getGetSaleOrderRequestUrl } from "@/lib/api/api";
import type {
  DispatchSalesOrderLineRequest,
  DispatchSalesOrderLineResult,
  ErrorResponse,
  SalesOrder,
  SalesOrderId,
  SalesOrderLineId,
} from "@/lib/api/schemas";

type SalesOrderActionResponse =
  | { data: SalesOrder; status: 200; headers: Headers }
  | { data: ErrorResponse; status: 404 | 409 | 500; headers: Headers };

type DispatchSalesOrderLineResponse =
  | { data: DispatchSalesOrderLineResult; status: 201; headers: Headers }
  | { data: ErrorResponse; status: 400 | 404 | 409 | 500; headers: Headers };

async function parseResponse(response: Response) {
  const body = await response.text();
  return body ? JSON.parse(body) : {};
}

export async function updateSalesOrderStatusRequest(
  id: SalesOrderId
): Promise<SalesOrderActionResponse> {
  const response = await fetch(`${getGetSaleOrderRequestUrl(id)}/advance`, {
    method: "PATCH",
    credentials: "include",
  });

  return {
    data: await parseResponse(response),
    status: response.status,
    headers: response.headers,
  } as SalesOrderActionResponse;
}

export async function cancelSalesOrderRequest(
  id: SalesOrderId
): Promise<SalesOrderActionResponse> {
  const response = await fetch(`${getGetSaleOrderRequestUrl(id)}/cancel`, {
    method: "PATCH",
    credentials: "include",
  });

  return {
    data: await parseResponse(response),
    status: response.status,
    headers: response.headers,
  } as SalesOrderActionResponse;
}

export async function confirmSalesOrderRequest(
  id: SalesOrderId
): Promise<SalesOrderActionResponse> {
  const response = await fetch(`${getGetSaleOrderRequestUrl(id)}/confirm`, {
    method: "PATCH",
    credentials: "include",
  });

  return {
    data: await parseResponse(response),
    status: response.status,
    headers: response.headers,
  } as SalesOrderActionResponse;
}

export async function dispatchSalesOrderLineRequest(
  id: SalesOrderId,
  lineId: SalesOrderLineId,
  payload: DispatchSalesOrderLineRequest
): Promise<DispatchSalesOrderLineResponse> {
  const response = await fetch(
    `${getGetSaleOrderRequestUrl(id)}/lines/${lineId}/dispatch`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  return {
    data: await parseResponse(response),
    status: response.status,
    headers: response.headers,
  } as DispatchSalesOrderLineResponse;
}
