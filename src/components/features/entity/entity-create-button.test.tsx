// @vitest-environment jsdom
/* oxlint-disable vitest/require-mock-type-parameters */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PERMISSIONS } from "@/lib/auth/permissions";

import { EntityCreateButton } from "./entity-create-button";

const auth = vi.hoisted(() => ({
  policies: [] as string[],
  isInDev: false,
}));

vi.mock("@/lib/auth/use-auth-store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      actor: { policies: auth.policies },
      isInDev: auth.isInDev,
    }),
}));

afterEach(() => {
  cleanup();
  auth.policies = [];
  auth.isInDev = false;
});

describe("EntityCreateButton", () => {
  it("renders when the policy is held", () => {
    auth.policies = [PERMISSIONS.customerCreate];

    render(
      <EntityCreateButton policy={PERMISSIONS.customerCreate}>
        Nuevo cliente
      </EntityCreateButton>
    );

    expect(screen.getByRole("button", { name: /Nuevo cliente/ })).toBeTruthy();
  });

  it("hides the button when the policy is missing", () => {
    auth.policies = [PERMISSIONS.customerView];

    render(
      <EntityCreateButton policy={PERMISSIONS.customerCreate}>
        Nuevo cliente
      </EntityCreateButton>
    );

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders when the policy is omitted (self-service action)", () => {
    auth.policies = [];

    render(<EntityCreateButton>Agregar dirección</EntityCreateButton>);

    expect(
      screen.getByRole("button", { name: /Agregar dirección/ })
    ).toBeTruthy();
  });

  it("renders when any policy in an any-of list is held", () => {
    auth.policies = [PERMISSIONS.orderTagManage];

    render(
      <EntityCreateButton
        policy={[PERMISSIONS.salesOrderUpdate, PERMISSIONS.orderTagManage]}
      >
        Nueva etiqueta
      </EntityCreateButton>
    );

    expect(screen.getByRole("button", { name: /Nueva etiqueta/ })).toBeTruthy();
  });

  it("renders everything while auth checks are disabled", () => {
    auth.isInDev = true;
    auth.policies = [];

    render(
      <EntityCreateButton policy={PERMISSIONS.permissionManage}>
        Nuevo permiso
      </EntityCreateButton>
    );

    expect(screen.getByRole("button", { name: /Nuevo permiso/ })).toBeTruthy();
  });
});
