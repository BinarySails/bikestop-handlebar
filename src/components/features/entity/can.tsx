import type { ReactNode } from "react";

import { useHasPolicy } from "@/lib/auth/permissions";

type CanProps = {
  /** Permission slug, or a list where holding any one of them grants access. */
  policy: string | readonly string[];
  /** Rendered instead of `children` when the policy is not held. */
  fallback?: ReactNode;
  children: ReactNode;
};

/**
 * Renders `children` only when the signed-in actor holds `policy`.
 *
 * Denied actions are hidden rather than disabled: a greyed-out control still
 * invites clicks that cannot succeed. The route-level `requirePolicy` guard
 * remains the backstop for direct URL navigation.
 */
export function Can({ policy, fallback = null, children }: CanProps) {
  const allowed = useHasPolicy(policy);

  if (!allowed) return <>{fallback}</>;

  return <>{children}</>;
}
