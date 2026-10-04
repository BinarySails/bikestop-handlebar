import type { ComponentProps, ReactNode } from "react";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WILDCARD_POLICY, useHasPolicy } from "@/lib/auth/permissions";

type EntityCreateButtonProps = {
  children: ReactNode;
  /**
   * When provided, the button is hidden unless one of the policies is held.
   * Omit it for self-service actions that any signed-in actor may perform
   * (e.g. a client managing their own addresses).
   */
  policy?: string | readonly string[];
  onClick?: () => void;
  render?: ComponentProps<typeof Button>["render"];
};

export function EntityCreateButton({
  children,
  policy,
  onClick,
  render,
}: EntityCreateButtonProps) {
  // Called unconditionally so the hook order stays stable when `policy` changes.
  const holdsPolicy = useHasPolicy(policy ?? [WILDCARD_POLICY]);
  const allowed = policy === undefined || holdsPolicy;

  if (!allowed) return null;

  return (
    <Button
      render={render}
      onClick={onClick}
      className="bg-gray-900 text-white hover:bg-gray-800"
    >
      <PlusIcon data-icon="inline-start" />
      {children}
    </Button>
  );
}
