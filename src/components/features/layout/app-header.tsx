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
      </div>
    </header>
  )
}
