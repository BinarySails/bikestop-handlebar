import { Button } from "@/components/ui/button";

export function AppFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="flex min-h-14 flex-col items-center justify-between gap-2 px-4 py-3 sm:flex-row sm:px-6">
        <p className="text-center text-xs text-muted-foreground sm:text-left">
          © 2026 BikeStop. Todos los derechos reservados.
        </p>

        <nav
          className="flex items-center"
          aria-label="Enlaces del pie de página"
        >
          <Button variant="link" size="sm" className="text-muted-foreground">
            Ayuda
          </Button>
        </nav>
      </div>
    </footer>
  );
}
