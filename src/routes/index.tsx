import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/lib/auth/use-auth-store";
import { validateSession } from "@/lib/auth/require-auth";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { isInDev } = useAuthStore.getState();

    if (isInDev) {
      throw redirect({ to: "/dashboard" });
    }

    const { ok } = await validateSession();

    if (ok) {
      throw redirect({ to: "/dashboard" });
    }

    throw redirect({ to: "/login" });
  },
});
