import type { ProductId } from "./productId.ts"

export interface Brand {
  created_at: string
  /** @nullable */
  image_url?: string | null
  display_name: string
  id: ProductId
}
