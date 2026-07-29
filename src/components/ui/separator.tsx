import { cn } from "@/lib/utils"

function Separator({ className, ...props }: React.ComponentProps<"hr">) {
  return <hr data-slot="separator" className={cn("h-px border-t", className)} {...props} />
}

export { Separator }
