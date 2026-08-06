/**
 * Branch schema for the Bikestop API
 */
import type { BranchId } from "./branchId.ts";
import type { CustomerId } from "./customerId.ts";
import type { StateId } from "./stateId.ts";
import type { LocalityId } from "./localityId.ts";

export interface Branch {
  id: BranchId;
  customer_id: CustomerId;
  state_id: StateId;
  locality_id: LocalityId;
  postal_code: string;
  address: string;
  is_default: boolean;
  created_at: string;
  state_name: string;
  locality_name: string;
}
