import type { SessionUser, UserResponse } from "@/lib/api/schemas"

export type Actor = (UserResponse | SessionUser) & {
  policies: string[]
}
