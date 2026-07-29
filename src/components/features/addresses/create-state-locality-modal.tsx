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

export function CreateStateLocalityDialog() {
  const [open, setOpen] = useState(false)

  const form = useForm({
    defaultValues: {
      stateDisplayName: "",
      localityDisplayName: "",
    },
    onSubmit: () => undefined,
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        New State / Locality
      </DialogTrigger>

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
            <Button type="submit">Create State and Locality</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
