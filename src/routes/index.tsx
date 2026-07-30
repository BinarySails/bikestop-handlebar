import { createFileRoute } from "@tanstack/react-router"
import { AppFooter } from "@/components/features/layout/app-footer"
import { AppHeader } from "@/components/features/layout/app-header"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <div className="flex min-h-svh flex-col bg-muted/20">
      <AppHeader />
      <main className="flex-1" />
      <AppFooter />
    </div>
  )
}
