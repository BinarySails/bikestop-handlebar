// @vitest-environment jsdom
/* oxlint-disable vitest/require-mock-type-parameters */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UserViewParam, type ListUsersRequestParams } from "@/lib/api/schemas";

import { UsersTableCard } from "./users-table-card";

const api = vi.hoisted(() => ({
  listUsers: vi.fn(),
  listRoles: vi.fn(),
  mutate: vi.fn(),
}));

vi.mock("@/lib/api/api", () => ({
  useListUsersRequest: api.listUsers,
  useListRolesHandler: api.listRoles,
}));
vi.mock("./create-user-modal", () => ({
  CreateUserDialog: () => <button>Crear Usuario</button>,
}));
vi.mock("./edit-user-dialog", () => ({
  EditUserDialog: () => <button aria-label="Editar usuario">Ver</button>,
}));

const adminRole = {
  id: "11111111-1111-4111-8111-111111111111",
  display_name: "Administrador",
  slug: "admin",
  status: "active" as const,
  created_at: "2026-01-01T00:00:00Z",
};
const salesRole = {
  id: "22222222-2222-4222-8222-222222222222",
  display_name: "Ventas",
  slug: "sales",
  status: "active" as const,
  created_at: "2026-01-01T00:00:00Z",
};
const user = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "Juan",
  father_last_name: "Pérez",
  mother_last_name: null,
  email: "juan@example.com",
  username: "juan",
  status: "active" as const,
  created_at: "2026-01-01T00:00:00Z",
  roles: [adminRole, salesRole],
};

const defaultParams: ListUsersRequestParams = {
  view: UserViewParam.staff,
  limit: 20,
  offset: 0,
  sort_by: "display_name",
  sort_order: "asc",
};

function queryState() {
  return {
    data: {
      status: 200,
      data: { users: [user], limit: 20, offset: 0, total: 45 },
    },
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: api.mutate,
  };
}

describe("UsersTableCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listUsers.mockReturnValue(queryState());
    api.listRoles.mockReturnValue({
      data: { status: 200, data: { roles: [adminRole, salesRole] } },
    });
  });

  afterEach(() => cleanup());

  it("sends backend params and renders multiple roles", () => {
    const params = { ...defaultParams, role: adminRole.id };
    render(<UsersTableCard params={params} onParamsChange={vi.fn()} />);

    expect(api.listUsers).toHaveBeenCalledWith(params, {
      swr: { keepPreviousData: true },
    });
    expect(screen.getByText("Administrador")).toBeTruthy();
    expect(screen.getByText("Ventas")).toBeTruthy();
    expect(screen.getByText("juan@example.com")).toBeTruthy();
  });

  it("debounces client search and resets pagination", async () => {
    const onParamsChange = vi.fn();
    render(
      <UsersTableCard
        params={{ ...defaultParams, view: UserViewParam.client, offset: 20 }}
        onParamsChange={onParamsChange}
      />
    );

    expect(api.listUsers).toHaveBeenCalledWith(
      {
        view: UserViewParam.client,
        search: undefined,
        limit: 20,
        offset: 20,
      },
      { swr: { keepPreviousData: true } }
    );
    expect(screen.getByText("Fecha de registro")).toBeTruthy();
    expect(
      screen.getByText(
        new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(
          new Date(user.created_at)
        )
      )
    ).toBeTruthy();
    expect(screen.queryByText("Nombre: A–Z")).toBeNull();

    fireEvent.change(
      screen.getByLabelText("Buscar por nombre, usuario o correo"),
      {
        target: { value: "  juan  " },
      }
    );
    await waitFor(
      () =>
        expect(onParamsChange).toHaveBeenCalledWith({
          search: "juan",
          offset: 0,
        }),
      { timeout: 700 }
    );
  });

  it("navigates views and uses server pagination totals", () => {
    const onParamsChange = vi.fn();
    render(
      <UsersTableCard params={defaultParams} onParamsChange={onParamsChange} />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Usuarios archivados" })
    );
    expect(onParamsChange).toHaveBeenCalledWith({
      view: UserViewParam.archived,
      search: undefined,
      role: undefined,
      sort_by: "display_name",
      sort_order: "asc",
      offset: 0,
    });

    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(onParamsChange).toHaveBeenCalledWith({ offset: 20 });
    expect(screen.getByText("Página 1 de 3")).toBeTruthy();
  });
});
