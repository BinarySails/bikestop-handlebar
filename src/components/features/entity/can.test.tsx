// @vitest-environment jsdom
/* oxlint-disable vitest/require-mock-type-parameters */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PERMISSIONS } from "@/lib/auth/permissions";

import { Can } from "./can";

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

describe("Can", () => {
  it("renders children when the policy is held", () => {
    auth.policies = [PERMISSIONS.categoryUpdate];

    render(
      <Can policy={PERMISSIONS.categoryUpdate}>
        <button type="button">Editar</button>
      </Can>
    );

    expect(screen.getByRole("button", { name: "Editar" })).toBeTruthy();
  });

  it("hides children when the policy is missing", () => {
    auth.policies = [PERMISSIONS.categoryView];

    render(
      <Can policy={PERMISSIONS.categoryUpdate}>
        <button type="button">Editar</button>
      </Can>
    );

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("hides children when the actor holds no policies", () => {
    render(
      <Can policy={PERMISSIONS.roleManage}>
        <button type="button">Eliminar rol</button>
      </Can>
    );

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders children when any policy in an any-of list is held", () => {
    auth.policies = [PERMISSIONS.productUpdate];

    render(
      <Can policy={[PERMISSIONS.productUpdate, PERMISSIONS.productDelete]}>
        <button type="button">Archivar</button>
      </Can>
    );

    expect(screen.getByRole("button", { name: "Archivar" })).toBeTruthy();
  });

  it("renders the fallback when the policy is missing", () => {
    auth.policies = [];

    render(
      <Can
        policy={PERMISSIONS.permissionManage}
        fallback={<span>Solo lectura</span>}
      >
        <button type="button">Editar</button>
      </Can>
    );

    expect(screen.getByText("Solo lectura")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders children for the super-admin wildcard", () => {
    auth.policies = ["*"];

    render(
      <Can policy={PERMISSIONS.permissionManage}>
        <button type="button">Editar</button>
      </Can>
    );

    expect(screen.getByRole("button", { name: "Editar" })).toBeTruthy();
  });
});
