/**
 * Customer schema for the Bikestop API
 */
import type { CustomerId } from "./customerId.ts";
import type { CustomerStatus } from "./customerStatus.ts";

export interface Customer {
  id: CustomerId;
  user_id: string;
  company_name: string;
  tax_id: string | null;
  phone: string | null;
  email: string | null;
  status: CustomerStatus;
  created_at: string;
  updated_at: string;
}
