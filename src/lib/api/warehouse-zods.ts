import * as zod from "zod"

export const AddressResponse = zod.object({
  id: zod.uuid(),
  country: zod.string().min(1),
  state: zod.string().min(1),
  city: zod.string().min(1),
  postal_code: zod.string().min(1),
  address: zod.string().min(1),
  created_at: zod.iso.datetime({ offset: true }),
})

export const CreateWarehouseRequestBody = zod.object({
  status: zod.literal("enable"),
  code: zod.string().min(1),
  name: zod.string().min(1),
  description: zod.string().nullish(),
  address: zod.object({
    country: zod.string().min(1),
    state: zod.string().min(1),
    city: zod.string().min(1),
    postal_code: zod.string().min(1),
    address: zod.string().min(1),
  }),
})

export const CreateWarehouseRequestResponse = zod.object({
  id: zod.uuid(),
  status: zod.string(),
  code: zod.string(),
  name: zod.string(),
  description: zod.string().nullish(),
  address: AddressResponse,
  created_at: zod.iso.datetime({ offset: true }),
  updated_at: zod.iso.datetime({ offset: true }),
})
