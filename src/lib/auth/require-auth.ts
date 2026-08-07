import { redirect } from "@tanstack/react-router";
import { meHandler } from "@/lib/api/api";
import { policiesFromAuthUser, rolesFromAuthUser } from "./derive-policies";
import { useAuthStore } from "./use-auth-store";

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
  const {
    isAuthenticated,
    setAuth,
    clearAuth,
    isInDev,
    checkSession,
    expiresAt,
    isInitialChecked,
    setInitialChecked,
  } = useAuthStore.getState();

  if (isInDev) {
    return;
  }

  if (isAuthenticated) {
    if (checkSession()) {
      return;
    }
  }

  if (!isInitialChecked) {
    try {
      const { data, status } = await meHandler();
      const user = status === 200 ? data.user : null;

      if (user && status === 200) {
        setAuth(
          {
            ...user,
            policies: policiesFromAuthUser(user),
            roles: rolesFromAuthUser(user),
          },
          expiresAt || undefined
        );
        console.info("Session validated via initial check in beforeLoad");
        return;
      }
    } catch (err) {
      console.debug("Initial session check failed", err);
    } finally {
      setInitialChecked();
    }
  }

  try {
    const { data, status } = await meHandler();
    const user = status === 200 ? data.user : null;

    if (user && status === 200) {
      setAuth(
        {
          ...user,
          policies: policiesFromAuthUser(user),
          roles: rolesFromAuthUser(user),
        },
        expiresAt || undefined
      );
      console.info("Session validated via beforeLoad");
      return;
    } else {
      clearAuth();
    }
  } catch (err) {
    console.debug("Session check failed", err);
    clearAuth();
  }

  throw redirect({
    to: navigateTo,
    search: {
      next: location.href,
    },
  });
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
