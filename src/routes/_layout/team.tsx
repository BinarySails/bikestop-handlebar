import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/team")({
  component: TeamLayout,
});

function TeamLayout() {
  return <Outlet />;
}
