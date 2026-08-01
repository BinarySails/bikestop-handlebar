import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { GalleryVerticalEnd } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { LoginForm } from "@/components/login-form"
import { useLoginHandler } from "@/lib/api/api"
import { useAuthStore } from "@/lib/auth/use-auth-store"

const DEFAULT_SESSION_DURATION_MS = 24 * 60 * 60 * 1000

function getExpiryFromHeaders(headers: Headers): string | null {
  const setCookie = headers.get("Set-Cookie")
  if (!setCookie) return null

  const maxAgeMatch = setCookie.match(/Max-Age=(\d+)/i)
  if (maxAgeMatch) {
    const maxAgeSeconds = Number.parseInt(maxAgeMatch[1], 10)
    if (!Number.isNaN(maxAgeSeconds)) {
      return new Date(Date.now() + maxAgeSeconds * 1000).toISOString()
    }
  }

  const expiresMatch = setCookie.match(/Expires=([^;]+)/i)
  if (expiresMatch) {
    const expiryDate = new Date(expiresMatch[1])
    if (!Number.isNaN(expiryDate.getTime())) {
      return expiryDate.toISOString()
    }
  }

  return null
}

export const Route = createFileRoute("/login")({
  beforeLoad: ({ search }) => {
    const { isAuthenticated, checkSession } = useAuthStore.getState()
    if (isAuthenticated && checkSession()) {
      throw redirect({
        to: search.next || "/dashboard",
      })
    }
  },
  component: LoginPage,
  validateSearch: z.object({
    next: z.string().optional(),
  }),
})

function LoginPage() {
  const { trigger, isMutating } = useLoginHandler()
  const navigate = useNavigate()
  const search = Route.useSearch()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email")
    const password = formData.get("password")

    if (typeof email !== "string" || typeof password !== "string") {
      toast.error("Correo electrónico y contraseña son requeridos.")
      return
    }

    const result = await trigger({ identifier: email, password })

    if (result.status === 200) {
      const expiresAt =
        getExpiryFromHeaders(result.headers) ||
        new Date(Date.now() + DEFAULT_SESSION_DURATION_MS).toISOString()

      useAuthStore
        .getState()
        .setAuth({ ...result.data.user, policies: [] }, expiresAt)

      toast.success("Sesión iniciada.")
      await navigate({ to: search.next || "/dashboard" })
      return
    }

    const errorMessage =
      result.status === 401
        ? "Credenciales inválidas."
        : "Error al iniciar sesión. Intenta de nuevo."

    toast.error(errorMessage)
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            BikeStop
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm onSubmit={handleSubmit} disabled={isMutating} />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/placeholder.svg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
