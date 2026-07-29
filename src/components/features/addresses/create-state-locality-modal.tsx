import { useState } from "react"
import { useForm } from "@tanstack/react-form"

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

export function CreateStateLocalityDialog() {
  const [open, setOpen] = useState(false)
  const { trigger: createState } = useCreateStateRequest()

  const form = useForm({
    defaultValues: {
      stateDisplayName: "",
      localityDisplayName: "",
    },
    onSubmit: async ({ value }) => {
      const stateResponse = await createState({
        display_name: value.stateDisplayName,
      })

      if (stateResponse.status !== 201) return

      await createLocalityRequest(stateResponse.data.id, {
        display_name: value.localityDisplayName,
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            form.handleSubmit()
          }}
        >
          <form.Field name="stateDisplayName">
            {(field) => (
              <div className="grid gap-2">
                <div>
                  <p className="font-medium">1. State</p>
                  <p className="text-sm text-muted-foreground">
                    Enter the State that will own the new Locality.
                  </p>
                </div>
                <Label htmlFor={field.name}>Display name</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Jalisco"
                  autoComplete="address-level1"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="localityDisplayName">
            {(field) => (
              <div className="grid gap-2 border-t pt-5">
                <div>
                  <p className="font-medium">2. Locality</p>
                  <p className="text-sm text-muted-foreground">
                    This Locality will be created inside the State above.
                  </p>
                </div>
                <Label htmlFor={field.name}>Display name</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Guadalajara"
                  autoComplete="address-level2"
                />
              </div>
            )}
          </form.Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Creating State and Locality..."
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
