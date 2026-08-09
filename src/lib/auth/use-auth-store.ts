import { toast } from "sonner";
import { create } from "zustand";
import type { Actor } from "./types";

const IS_DEV = import.meta.env.VITE_DISABLE_AUTH === "true";

export type ValidationResult = {
  ok: boolean;
  status?: number;
  error?: unknown;
};

const resolvedValidation = (
  result: ValidationResult
): Promise<ValidationResult> => Promise.resolve(result);

interface AuthState {
  actor: Actor | null;
  isAuthenticated: boolean;
  expiresAt: string | null;
  isInitialChecked: boolean;
  validationPromise: Promise<ValidationResult> | null;
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
  validationPromise: null,
  setAuth: (actor, expiresAt) => {
    if (expiresAt) {
      setStoredExpiry(expiresAt);
    }

    set({
      actor,
      isAuthenticated: true,
      expiresAt: expiresAt || getStoredExpiry() || null,
      isInitialChecked: true,
      validationPromise: resolvedValidation({ ok: true, status: 200 }),
    });
  },
  clearAuth: () => {
    removeStoredExpiry();

    set({
      actor: null,
      isAuthenticated: false,
      expiresAt: null,
      isInitialChecked: true,
      validationPromise: null,
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
