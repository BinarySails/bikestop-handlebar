import { redirect } from "@tanstack/react-router";
import { toast } from "sonner";

import { useAuthStore } from "./use-auth-store";

/**
 * Wildcard permission held by the `super-admin` role. Grants every action,
 * mirroring `WILDCARD_PERMISSION` in the backend
 * (`src/shared/infrastructure/http/authorization.rs`).
 */
export const WILDCARD_POLICY = "*";

export const PERMISSIONS = {
  panelView: "panel:view",
  statisticsView: "statistics:view",
  auditLogView: "audit-log:view",

  productView: "product:view",
  productCreate: "product:create",
  productUpdate: "product:update",
  productDelete: "product:delete",

  categoryView: "category:view",
  categoryCreate: "category:create",
  categoryUpdate: "category:update",
  categoryDelete: "category:delete",

  brandView: "brand:view",
  brandCreate: "brand:create",
  brandUpdate: "brand:update",
  brandDelete: "brand:delete",

  inventoryView: "inventory:view",
  inventoryCreate: "inventory:create",

  warehouseView: "warehouse:view",
  warehouseCreate: "warehouse:create",
  warehouseUpdate: "warehouse:update",
  warehouseDelete: "warehouse:delete",

  locationView: "location:view",
  locationCreate: "location:create",
  locationUpdate: "location:update",
  locationDelete: "location:delete",

  salesOrderView: "sales-order:view",
  salesOrderCreate: "sales-order:create",
  salesOrderUpdate: "sales-order:update",
  salesOrderDelete: "sales-order:delete",
  salesOrderManagePayments: "sales-order:manage-payments",
  orderTagManage: "order-tag:manage",

  customerView: "customer:view",
  customerCreate: "customer:create",
  customerUpdate: "customer:update",
  customerDelete: "customer:delete",

  userView: "user:view",
  userCreate: "user:create",
  userUpdate: "user:update",
  userDelete: "user:delete",

  roleView: "role:view",
  roleManage: "role:manage",
  permissionView: "permission:view",
  permissionManage: "permission:manage",

  promotionView: "promotion:view",
  promotionCreate: "promotion:create",
  promotionUpdate: "promotion:update",
  promotionDelete: "promotion:delete",

  paymentTermView: "payment-term:view",
  paymentTermManage: "payment-term:manage",

  fileUpload: "file:upload",

  b2bShop: "b2b:shop",
} as const;

export type Policy =
  | (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
  | typeof WILDCARD_POLICY;

function toList(policy: string | readonly string[]): readonly string[] {
  return Array.isArray(policy) ? policy : [policy as string];
}

/**
 * Whether `policies` grants `policy`.
 *
 * Mirrors the backend check in `RequirePermission::from_request_parts`: the
 * wildcard slug short-circuits everything, otherwise the exact slug must be
 * present. When given an array, grants access if **any** of them is satisfied.
 */
export function hasPolicy(
  policies: readonly string[] | undefined | null,
  policy: string | readonly string[]
): boolean {
  if (!policies) return false;
  if (policies.includes(WILDCARD_POLICY)) return true;
  return toList(policy).some((required) => policies.includes(required));
}

/**
 * Reactive `hasPolicy` bound to the signed-in actor.
 *
 * Returns `true` while auth checks are disabled via `VITE_DISABLE_AUTH`, so
 * local development stays usable without seeding roles.
 */
export function useHasPolicy(policy: string | readonly string[]): boolean {
  const policies = useAuthStore((state) => state.actor?.policies);
  const isInDev = useAuthStore((state) => state.isInDev);

  if (isInDev) return true;

  return hasPolicy(policies, policy);
}

/**
 * Deny navigation: toast the reason, then hand off to the `/forbidden` screen.
 *
 * Always throws, so it must be called as `throw denyAccess(...)`.
 */
export function denyAccess({
  policy,
  from,
}: {
  policy: string | readonly string[];
  from?: string;
}): never {
  const label = toList(policy).join(" o ");

  toast.error("No tienes permisos para acceder a esta sección.", {
    description: `Se requiere el permiso ${label}.`,
  });

  throw redirect({
    to: "/forbidden",
    search: { policy: label, from },
  });
}
