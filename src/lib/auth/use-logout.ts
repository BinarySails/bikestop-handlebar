import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { logoutHandler } from "@/lib/api/api";
import { useAuthStore } from "./use-auth-store";

export function useLogout() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutHandler();
    } catch {
      // clear the local session regardless of the server response
    }
    useAuthStore.getState().clearAuth();
    await navigate({ to: "/login" });
    setIsLoggingOut(false);
  }, [isLoggingOut, navigate]);

  return { logout, isLoggingOut };
}
