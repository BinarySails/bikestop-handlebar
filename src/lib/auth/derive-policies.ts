import type { AuthUser, Role } from "@/lib/api/schemas";

export function policiesFromAuthUser(user: AuthUser): string[] {
  return user.permissions.map((p) => p.slug);
}

export function rolesFromAuthUser(user: AuthUser): Role[] {
  return user.roles;
}
