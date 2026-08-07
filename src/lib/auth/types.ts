import type { AuthUser, Role } from "@/lib/api/schemas";

export type Actor = AuthUser & {
  policies: string[];
  roles: Role[];
};
