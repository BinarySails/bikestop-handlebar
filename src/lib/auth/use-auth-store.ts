import { toast } from "sonner";
import { create } from "zustand";
import type { Actor } from "./types";

const IS_DEV = import.meta.env.VITE_DISABLE_AUTH === "true";

interface AuthState {
  actor: Actor | null;
  isAuthenticated: boolean;
  expiresAt: string | null;
  isInitialChecked: boolean;
  setAuth: (actor: Actor, expiresAt?: string) => void;
  clearAuth: () => void;
  setInitialChecked: () => void;
  checkSession: () => boolean;
  isInDev: boolean;
}

const SESSION_EXPIRY_KEY = "bikestop_session_expiry";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function getStoredExpiry(): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(SESSION_EXPIRY_KEY);
  } catch {
    return null;
  }
}

function setStoredExpiry(expiresAt: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(SESSION_EXPIRY_KEY, expiresAt);
  } catch {
    // ignore storage errors
  }
}

function removeStoredExpiry(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(SESSION_EXPIRY_KEY);
  } catch {
    // ignore storage errors
  }
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  actor: null,
  isAuthenticated: false,
  expiresAt: getStoredExpiry(),
  isInitialChecked: false,
  setAuth: (actor, expiresAt) => {
    if (expiresAt) {
      setStoredExpiry(expiresAt);
    }

    set({
      actor,
      isAuthenticated: true,
      expiresAt: expiresAt || getStoredExpiry() || null,
      isInitialChecked: true,
    });
  },
  clearAuth: () => {
    removeStoredExpiry();

    set({
      actor: null,
      isAuthenticated: false,
      expiresAt: null,
      isInitialChecked: true,
    });
  },
  setInitialChecked: () => set({ isInitialChecked: true }),
  checkSession: () => {
    const { expiresAt, isAuthenticated, clearAuth } = get();
    if (!expiresAt) return isAuthenticated;

    const expiryDate = new Date(expiresAt);
    if (expiryDate <= new Date()) {
      console.info("Session expired based on expiresAt");
      if (isBrowser()) {
        toast.error("Sesión expirada.");
      }
      clearAuth();
      return false;
    }

    return isAuthenticated;
  },
  isInDev: IS_DEV,
}));
