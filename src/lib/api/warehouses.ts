import type { Key } from "swr"
import useSWRMutation from "swr/mutation"
import type { SWRMutationConfiguration } from "swr/mutation"
import type { ErrorResponse } from "./schemas"
import type { CreateWarehouseRequest, Warehouse } from "./warehouse-schemas"

export type createWarehouseRequestResponse201 = {
  data: Warehouse
  status: 201
}

export type createWarehouseRequestResponse400 = {
  data: ErrorResponse
  status: 400
}

export type createWarehouseRequestResponse500 = {
  data: void
  status: 500
}

export type createWarehouseRequestResponseSuccess =
  createWarehouseRequestResponse201 & {
    headers: Headers
  }
export type createWarehouseRequestResponseError = (
  createWarehouseRequestResponse400 | createWarehouseRequestResponse500
) & {
  headers: Headers
}

export type createWarehouseRequestResponse =
  createWarehouseRequestResponseSuccess | createWarehouseRequestResponseError

export const getCreateWarehouseRequestUrl = () => {
  return `http://localhost:8080/api/v1/warehouses`
}

export const createWarehouseRequest = async (
  createWarehouseRequest: CreateWarehouseRequest,
  options?: RequestInit
): Promise<createWarehouseRequestResponse> => {
  const res = await fetch(getCreateWarehouseRequestUrl(), {
    credentials: "include",
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(createWarehouseRequest),
  })

  const body = [204, 205, 304].includes(res.status) ? null : await res.text()

  const data: createWarehouseRequestResponse["data"] = body
    ? JSON.parse(body)
    : {}
  return {
    data,
    status: res.status,
    headers: res.headers,
  } as createWarehouseRequestResponse
}

export const getCreateWarehouseRequestMutationFetcher = (
  options?: RequestInit
) => {
  return (_: Key, { arg }: { arg: CreateWarehouseRequest }) => {
    return createWarehouseRequest(arg, options)
  }
}

export const getCreateWarehouseRequestMutationKey = () =>
  [`http://localhost:8080/api/v1/warehouses`] as const

export type CreateWarehouseRequestMutationResult = NonNullable<
  Awaited<ReturnType<typeof createWarehouseRequest>>
>

export const useCreateWarehouseRequest = <
  TError = Promise<ErrorResponse | void>,
>(options?: {
  swr?: SWRMutationConfiguration<
    Awaited<ReturnType<typeof createWarehouseRequest>>,
    TError,
    Key,
    CreateWarehouseRequest,
    Awaited<ReturnType<typeof createWarehouseRequest>>
  > & { swrKey?: string }
  fetch?: RequestInit
}) => {
  const { swr: swrOptions, fetch: fetchOptions } = options ?? {}

  const swrKey = swrOptions?.swrKey ?? getCreateWarehouseRequestMutationKey()
  const swrFn = getCreateWarehouseRequestMutationFetcher(fetchOptions)

  const query = useSWRMutation(swrKey, swrFn, swrOptions)

  return {
    swrKey,
    ...query,
  }
}
