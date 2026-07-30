import { createFileRoute } from "@tanstack/react-router"
import { AppFooter } from "@/components/features/layout/app-footer"
import { AppHeader } from "@/components/features/layout/app-header"
import { AppSidebar } from "@/components/features/layout/app-sidebar"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <div className="flex min-h-svh flex-col bg-muted/20">
      <AppHeader />
      <div className="flex flex-1">
        <AppSidebar />
        <main className="min-w-0 flex-1" />
      </div>
      <AppFooter />
    </div>
  )
}
