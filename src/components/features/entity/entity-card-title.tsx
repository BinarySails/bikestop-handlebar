import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type EntityCardTitleProps = {
  icon: LucideIcon;
  children: ReactNode;
};

export function EntityCardTitle({
  icon: Icon,
  children,
}: EntityCardTitleProps) {
  return (
    <>
      <Icon className="size-4" />
      {children}
    </>
  );
}
