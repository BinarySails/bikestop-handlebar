import { redirect } from "@tanstack/react-router";
import { meHandler } from "@/lib/api/api";
import { policiesFromAuthUser, rolesFromAuthUser } from "./derive-policies";
import { useAuthStore } from "./use-auth-store";

/**
 * Validates the current session against the backend by calling `meHandler`.
 *
 * On success, populates the auth store with the returned user and policies/roles.
 * On any failure (non-200, thrown error, missing payload), clears the auth store.
 *
 * Intended to be used in TanStack Router's `beforeLoad` hook via the `requireAuth`
 * guard or directly in routes that need to re-check the session (e.g. `/`).
 */
export async function validateSession(): Promise<{
  ok: boolean;
  status?: number;
  error?: unknown;
}> {
  const { setAuth, clearAuth, expiresAt } = useAuthStore.getState();

  try {
    const { data: user, status } = await meHandler();

    if (user && status === 200) {
      setAuth(
        {
          ...user,
          policies: policiesFromAuthUser(user),
          roles: rolesFromAuthUser(user),
        },
        expiresAt || undefined
      );
      console.info("Session validated");
      return { ok: true, status };
    }

    console.error("Session check failed", { status });
    clearAuth();
    return { ok: false, status };
  } catch (err) {
    console.error("Session check failed", { err });
    clearAuth();
    return { ok: false, error: err };
  }
}

/**
 * Auth guard to be used in TanStack Router's `beforeLoad` hook.
 *
 * @example
 * export const Route = createFileRoute('/_layout/dashboard')({
 *   beforeLoad: (ctx) => requireAuth({ location: ctx.location, navigateTo: '/login' }),
 *   pendingComponent: () => <div>Loading...</div>
 * })
 */
export async function requireAuth({
  location,
  navigateTo = "/login",
}: {
  location: { href: string };
  navigateTo?: string;
}) {
  const { isInDev } = useAuthStore.getState();

  if (isInDev) {
    return;
  }

  const { ok } = await validateSession();

  if (!ok) {
    throw redirect({
      to: navigateTo,
      search: {
        next: location.href,
      },
    });
  }
}

/**
 * Policy guard to be used in TanStack Router's `beforeLoad` hook.
 */
export function requirePolicy(requiredPolicy: string) {
  const { actor, isInDev } = useAuthStore.getState();

  if (isInDev) return;

  if (actor?.policies?.includes("manage:all")) return;

  if (!actor?.policies?.includes(requiredPolicy)) {
    throw redirect({
      to: "/dashboard",
    });
  }
}
