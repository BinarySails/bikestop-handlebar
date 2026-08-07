import type { AuthUser, UserResponse } from "@/lib/api/schemas";

export type Actor = (UserResponse | AuthUser) & {
  policies: string[];
};
