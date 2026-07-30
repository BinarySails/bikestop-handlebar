import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/team")({ component: TeamPage })

function TeamPage() {
  return <section aria-label="Equipo" />
}
