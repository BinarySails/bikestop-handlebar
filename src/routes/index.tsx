import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <main className="container mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight">BikeStop</h1>
    </main>
  )
}
import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" })
  },
})
