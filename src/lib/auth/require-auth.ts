import { redirect } from "@tanstack/react-router";
import { meHandler } from "@/lib/api/api";
import { policiesFromAuthUser, rolesFromAuthUser } from "./derive-policies";
import { useAuthStore, type ValidationResult } from "./use-auth-store";

function isCacheFresh(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt) > new Date();
}

/**
 * Validates the current session against the backend by calling `meHandler`.
 *
 * The result is cached in the auth store: subsequent calls within the same
 * page lifecycle (or until `expiresAt` lapses) reuse the cached promise and
 * do not hit the network. The cache is repopulated by `setAuth` and cleared
 * by `clearAuth`, so login/logout/user-switch always re-validate.
 */
export async function validateSession(): Promise<ValidationResult> {
  const { validationPromise, expiresAt } = useAuthStore.getState();

  if (validationPromise && isCacheFresh(expiresAt)) {
    return validationPromise;
  }

  const promise = runValidation();
  useAuthStore.setState({ validationPromise: promise });
  return promise;
}

async function runValidation(): Promise<ValidationResult> {
  const { setAuth, clearAuth, expiresAt } = useAuthStore.getState();

  try {
    const { data, status } = await meHandler();
    const user = status === 200 ? data : null;

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

  if (import.meta.env.SSR) {
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
      to: "/admin/dashboard",
    });
  }
}
