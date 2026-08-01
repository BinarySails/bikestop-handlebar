import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/lib/auth/use-auth-store";

function App() {
  return (
    <main className="container mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight">BikeStop</h1>
    </main>
  );
}

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const { isAuthenticated, checkSession, isInDev } = useAuthStore.getState();

    if (isInDev || (isAuthenticated && checkSession())) {
      throw redirect({ to: "/dashboard" });
    }

    throw redirect({ to: "/login" });
  },
  component: App,
});
