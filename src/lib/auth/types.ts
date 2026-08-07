import type { Role, SessionUser, UserResponse } from "@/lib/api/schemas";

export type Actor = (UserResponse | SessionUser) & {
  policies: string[];
  roles: Role[];
};
