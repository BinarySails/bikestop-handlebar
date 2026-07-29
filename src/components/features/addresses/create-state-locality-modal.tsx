import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createLocalityRequest, useCreateStateRequest } from "@/lib/api/api"
import {
  CreateLocalityRequestBody,
  CreateStateRequestBody,
} from "@/lib/api/zods"

function validateDisplayName(value: string) {
  const displayName = value.trim()

  if (!displayName) return "Display name is required"
  if (displayName.length < 3) {
    return "Display name must be at least 3 characters"
  }

  return undefined
}

function getErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback

  const error = data as { content?: unknown; message?: unknown }

  if (typeof error.message === "string" && error.message.trim()) {
    return error.message
  }

  if (typeof error.content === "string" && error.content.trim()) {
    return error.content
  }

  return fallback
}

type ServerErrors = {
  locality?: string
  state?: string
}

export function CreateStateLocalityDialog() {
  const [open, setOpen] = useState(false)
  const [createdStateId, setCreatedStateId] = useState<string | null>(null)
  const [serverErrors, setServerErrors] = useState<ServerErrors>({})
  const { trigger: createState } = useCreateStateRequest()

  const form = useForm({
    defaultValues: {
      stateDisplayName: "",
      localityDisplayName: "",
    },
    onSubmit: async ({ value }) => {
      setServerErrors({})

      let stateId = createdStateId

      if (!stateId) {
        try {
          const stateResponse = await createState({
            display_name: value.stateDisplayName.trim(),
          })

          if (stateResponse.status !== 201) {
            const fallback =
              stateResponse.status === 400
                ? "The State display name is invalid"
                : stateResponse.status === 409
                  ? "State already exists"
                  : "Could not save State"
            const message = getErrorMessage(stateResponse.data, fallback)

            if (stateResponse.status === 400) {
              setServerErrors({ state: message })
            }

            toast.error(message)
            return
          }

          stateId = stateResponse.data.id
          setCreatedStateId(stateId)
        } catch {
          toast.error("Could not connect to the server while saving State")
          return
        }
      }

      try {
        const localityResponse = await createLocalityRequest(stateId, {
          display_name: value.localityDisplayName.trim(),
        })

        if (localityResponse.status !== 201) {
          const fallback =
            localityResponse.status === 400
              ? "The Locality display name is invalid"
              : localityResponse.status === 404
                ? "State not found"
                : localityResponse.status === 409
                  ? "Locality already exists in this State"
                  : "Could not save Locality"
          const message = getErrorMessage(localityResponse.data, fallback)

          if (localityResponse.status === 400) {
            setServerErrors({ locality: message })
          }

          toast.error(message)
          return
        }

        toast.success("State and Locality created successfully")
        form.reset()
        setCreatedStateId(null)
        setServerErrors({})
        setOpen(false)
      } catch {
        toast.error("Could not connect to the server while saving Locality")
      }
    },
  })

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (!nextOpen) {
      form.reset()
      setCreatedStateId(null)
      setServerErrors({})
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>New State / Locality</DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New State / Locality</DialogTitle>
          <DialogDescription>
            Create a State first, then create its Locality.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            form.handleSubmit()
          }}
        >
          <form.Field
            name="stateDisplayName"
            validators={{
              onChange: ({ value }) => {
                const result =
                  CreateStateRequestBody.shape.display_name.safeParse(value)

                if (!result.success) return result.error.issues[0]?.message
                return validateDisplayName(value)
              },
              onSubmit: ({ value }) => validateDisplayName(value),
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <div>
                  <p className="font-medium">1. State</p>
                  <p className="text-sm text-muted-foreground">
                    Enter the State that will own the new Locality.
                  </p>
                </div>
                <Label htmlFor={field.name}>Display name *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    setServerErrors((errors) => ({
                      ...errors,
                      state: undefined,
                    }))
                    field.handleChange(event.target.value)
                  }}
                  placeholder="Jalisco"
                  autoComplete="address-level1"
                  disabled={createdStateId !== null}
                  aria-invalid={
                    serverErrors.state || field.state.meta.errors.length > 0
                      ? "true"
                      : undefined
                  }
                  aria-describedby={
                    serverErrors.state || field.state.meta.errors.length > 0
                      ? `${field.name}-error`
                      : undefined
                  }
                />
                {(serverErrors.state || field.state.meta.errors[0]) && (
                  <p
                    id={`${field.name}-error`}
                    className="text-sm text-destructive"
                  >
                    {serverErrors.state ?? field.state.meta.errors[0]}
                  </p>
                )}
                {createdStateId && (
                  <p className="text-sm text-muted-foreground">
                    State created. Retrying will only create the Locality.
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="localityDisplayName"
            validators={{
              onChange: ({ value }) => {
                const result =
                  CreateLocalityRequestBody.shape.display_name.safeParse(value)

                if (!result.success) return result.error.issues[0]?.message
                return validateDisplayName(value)
              },
              onSubmit: ({ value }) => validateDisplayName(value),
            }}
          >
            {(field) => (
              <div className="grid gap-2 border-t pt-5">
                <div>
                  <p className="font-medium">2. Locality</p>
                  <p className="text-sm text-muted-foreground">
                    This Locality will be created inside the State above.
                  </p>
                </div>
                <Label htmlFor={field.name}>Display name *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    setServerErrors((errors) => ({
                      ...errors,
                      locality: undefined,
                    }))
                    field.handleChange(event.target.value)
                  }}
                  placeholder="Guadalajara"
                  autoComplete="address-level2"
                  aria-invalid={
                    serverErrors.locality || field.state.meta.errors.length > 0
                      ? "true"
                      : undefined
                  }
                  aria-describedby={
                    serverErrors.locality || field.state.meta.errors.length > 0
                      ? `${field.name}-error`
                      : undefined
                  }
                />
                {(serverErrors.locality || field.state.meta.errors[0]) && (
                  <p
                    id={`${field.name}-error`}
                    className="text-sm text-destructive"
                  >
                    {serverErrors.locality ?? field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? createdStateId
                      ? "Creating Locality..."
                      : "Creating State and Locality..."
                    : createdStateId
                      ? "Retry Locality"
                      : "Create State and Locality"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
