import { Link, createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <main className="container mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight">BikeStop</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Administración del catálogo.
      </p>
      <Button className="mt-4" render={<Link to="/locations" />}>
        Ir a ubicaciones
      </Button>
    </main>
  )
}
