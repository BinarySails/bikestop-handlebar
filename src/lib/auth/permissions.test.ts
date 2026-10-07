import { describe, expect, it } from "vitest";

import { PERMISSIONS, WILDCARD_POLICY, hasPolicy } from "./permissions";

describe("hasPolicy", () => {
  it("denies when the actor holds no policies", () => {
    expect(hasPolicy(undefined, PERMISSIONS.productView)).toBe(false);
    expect(hasPolicy(null, PERMISSIONS.productView)).toBe(false);
    expect(hasPolicy([], PERMISSIONS.productView)).toBe(false);
  });

  it("grants on an exact slug match", () => {
    expect(hasPolicy([PERMISSIONS.productView], PERMISSIONS.productView)).toBe(
      true
    );
  });

  it("denies on a prefix or partial match", () => {
    expect(hasPolicy(["product"], PERMISSIONS.productView)).toBe(false);
    expect(hasPolicy(["product:views"], PERMISSIONS.productView)).toBe(false);
  });

  it("grants everything for the super-admin wildcard", () => {
    const policies = [WILDCARD_POLICY];

    expect(hasPolicy(policies, PERMISSIONS.productView)).toBe(true);
    expect(hasPolicy(policies, PERMISSIONS.permissionManage)).toBe(true);
    expect(hasPolicy(policies, PERMISSIONS.b2bShop)).toBe(true);
  });

  it("grants when any policy in an any-of list is held", () => {
    const policies = [PERMISSIONS.salesOrderView];

    expect(
      hasPolicy(policies, [
        PERMISSIONS.salesOrderCreate,
        PERMISSIONS.salesOrderView,
      ])
    ).toBe(true);
    expect(
      hasPolicy(policies, [
        PERMISSIONS.salesOrderCreate,
        PERMISSIONS.salesOrderUpdate,
      ])
    ).toBe(false);
  });

  it("denies an empty any-of list even when other policies are held", () => {
    expect(hasPolicy([PERMISSIONS.productView], [])).toBe(false);
  });

  it("does not grant a distinct permission held alongside the requested one", () => {
    const policies = [PERMISSIONS.roleView, PERMISSIONS.permissionView];

    expect(hasPolicy(policies, PERMISSIONS.roleManage)).toBe(false);
    expect(hasPolicy(policies, PERMISSIONS.permissionManage)).toBe(false);
  });
});
