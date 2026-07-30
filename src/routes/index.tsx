import { createFileRoute } from "@tanstack/react-router"
import { AppHeader } from "@/components/features/layout/app-header"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <div className="min-h-svh bg-muted/20">
      <AppHeader />
      <main />
    </div>
  )
}
