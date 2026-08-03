import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/team")({ component: TeamPage });

function TeamPage() {
  return <section aria-label="Equipo" />;
}
