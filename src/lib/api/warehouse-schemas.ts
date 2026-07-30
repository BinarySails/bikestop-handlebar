export interface Address {
  id: string
  country: string
  state: string
  city: string
  postal_code: string
  address: string
  created_at: string
}

export interface Warehouse {
  id: string
  status: string
  code: string
  name: string
  description: string | null
  address: Address
  created_at: string
  updated_at: string
}

export interface CreateWarehouseRequest {
  status: "enable"
  code: string
  name: string
  description?: string | null
  address: {
    country: string
    state: string
    city: string
    postal_code: string
    address: string
  }
}
