import type { ComponentProps, ReactNode } from "react";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type EntityCreateButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  render?: ComponentProps<typeof Button>["render"];
};

export function EntityCreateButton({
  children,
  onClick,
  render,
}: EntityCreateButtonProps) {
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
