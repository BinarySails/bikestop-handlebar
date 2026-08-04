import { useAuthStore } from "@/lib/auth/use-auth-store";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const { isAuthenticated, checkSession, isInDev } = useAuthStore.getState();

    if (isInDev || (isAuthenticated && checkSession())) {
      throw redirect({ to: "/dashboard" });
    }

    throw redirect({ to: "/login" });
  },
});
