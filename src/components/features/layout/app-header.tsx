import { Button } from "@/components/ui/button"

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
        <a
          href="/"
          className="shrink-0 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label="BikeStop, ir al inicio"
        >
          <span className="text-lg font-semibold tracking-tight">
            Bike<span className="text-muted-foreground">Stop</span>
          </span>
        </a>

        <div className="ml-auto flex items-center">
          <Button
            variant="ghost"
            size="lg"
            className="h-10 gap-2 px-1.5 sm:pr-2.5"
            aria-label="Abrir perfil de usuario"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              U
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm leading-none font-medium">
                Usuario
              </span>
              <span className="mt-1 block text-xs leading-none font-normal text-muted-foreground">
                Rol de usuario
              </span>
            </span>
          </Button>
        </div>
      </div>
    </header>
  )
}
