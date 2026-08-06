/**
 * SaleOrderTag schema for the Bikestop API
 */
import type { SaleOrderTagId } from "./saleOrderTagId.ts";
import type { SaleOrderTagStatus } from "./saleOrderTagStatus.ts";

export interface SaleOrderTag {
  id: SaleOrderTagId;
  display_name: string;
  slug: string;
  color: string | null;
  status: SaleOrderTagStatus;
  created_at: string;
}
