// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { CreateStateLocalityDialog } from "./create-state-locality-modal"

const api = vi.hoisted(() => ({
  createLocality: vi.fn(),
  createState: vi.fn(),
}))

const notifications = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}))

vi.mock("@/lib/api/api", () => ({
  createLocalityRequest: api.createLocality,
  useCreateStateRequest: () => ({ trigger: api.createState }),
}))

vi.mock("sonner", () => ({
  toast: notifications,
}))

function openForm() {
  render(<CreateStateLocalityDialog />)
  fireEvent.click(
    screen.getByRole("button", { name: "Nuevo estado / localidad" })
  )
  return screen.getAllByLabelText("Nombre *")
}

function submitForm() {
  fireEvent.click(
    screen.getByRole("button", { name: "Crear estado y localidad" })
  )
}

async function fillValidForm() {
  const [stateInput, localityInput] = openForm()
  fireEvent.change(stateInput, { target: { value: "Jalisco" } })
  fireEvent.change(localityInput, { target: { value: "Guadalajara" } })

  await waitFor(() => {
    expect((stateInput as HTMLInputElement).value).toBe("Jalisco")
    expect((localityInput as HTMLInputElement).value).toBe("Guadalajara")
    expect(screen.queryByText("El nombre es obligatorio")).toBeNull()
  })
}

describe("CreateStateLocalityDialog", () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows required validation errors without calling the API", async () => {
    openForm()
    submitForm()

    expect(await screen.findAllByText("El nombre es obligatorio")).toHaveLength(
      2
    )
    expect(api.createState).not.toHaveBeenCalled()
    expect(api.createLocality).not.toHaveBeenCalled()
  })

  it("validates the minimum length in the client", async () => {
    const [stateInput, localityInput] = openForm()
    fireEvent.change(stateInput, { target: { value: "ab" } })
    fireEvent.change(localityInput, { target: { value: "xy" } })

    expect(
      await screen.findAllByText("El nombre debe tener al menos 3 caracteres")
    ).toHaveLength(2)
  })

  it("creates the State before its Locality using the returned id", async () => {
    api.createState.mockResolvedValue({
      data: { id: "state-id", display_name: "Jalisco", created_at: "" },
      status: 201,
    })
    api.createLocality.mockResolvedValue({
      data: {
        id: "locality-id",
        state_id: "state-id",
        display_name: "Guadalajara",
        created_at: "",
      },
      status: 201,
    })

    await fillValidForm()
    submitForm()

    await waitFor(() => {
      expect(api.createState).toHaveBeenCalledWith({ display_name: "Jalisco" })
      expect(api.createLocality).toHaveBeenCalledWith("state-id", {
        display_name: "Guadalajara",
      })
    })
    expect(api.createState.mock.invocationCallOrder[0]).toBeLessThan(
      api.createLocality.mock.invocationCallOrder[0]
    )
    expect(notifications.success).toHaveBeenCalledWith(
      "El estado y la localidad se crearon correctamente"
    )
  })

  it("continues with the existing State returned by an idempotent response", async () => {
    api.createState.mockResolvedValue({
      data: {
        id: "existing-state-id",
        display_name: "Jalisco",
        created_at: "",
      },
      status: 200,
    })
    api.createLocality.mockResolvedValue({
      data: {
        id: "locality-id",
        state_id: "existing-state-id",
        display_name: "Guadalajara",
        created_at: "",
      },
      status: 201,
    })

    await fillValidForm()
    submitForm()

    await waitFor(() => {
      expect(api.createLocality).toHaveBeenCalledWith("existing-state-id", {
        display_name: "Guadalajara",
      })
    })
    expect(notifications.error).not.toHaveBeenCalled()
    expect(notifications.success).toHaveBeenCalledWith(
      "El estado y la localidad se crearon correctamente"
    )
  })

  it("shows the backend validation error next to the State field", async () => {
    api.createState.mockResolvedValue({
      data: { type: "validation", message: "error while validating" },
      status: 400,
    })

    await fillValidForm()
    submitForm()

    expect(
      await screen.findByText("El nombre del estado no es válido")
    ).toBeTruthy()
    expect(notifications.error).toHaveBeenCalledWith(
      "El nombre del estado no es válido"
    )
  })

  it.each([
    [400, "error while validating", "El nombre de la localidad no es válido"],
    [404, "state not found", "No se encontró el estado"],
    [
      409,
      "locality already exists in this state",
      "La localidad ya existe dentro de este estado",
    ],
    [500, null, "No se pudo guardar la localidad"],
  ])(
    "handles Locality error %s",
    async (status, backendMessage, expectedMessage) => {
      api.createState.mockResolvedValue({
        data: { id: "state-id", display_name: "Jalisco", created_at: "" },
        status: 201,
      })
      api.createLocality.mockResolvedValue({
        data: backendMessage
          ? { type: "error", message: backendMessage }
          : undefined,
        status,
      })

      await fillValidForm()
      submitForm()

      await waitFor(() => {
        expect(notifications.error).toHaveBeenCalledWith(expectedMessage)
      })

      if (status === 400) {
        expect(await screen.findByText(expectedMessage)).toBeTruthy()
      }
    }
  )

  it("handles a network error while creating the State", async () => {
    api.createState.mockRejectedValue(new Error("network error"))

    await fillValidForm()
    submitForm()

    await waitFor(() => {
      expect(notifications.error).toHaveBeenCalledWith(
        "No se pudo conectar al servidor al guardar el estado"
      )
    })
    expect(api.createLocality).not.toHaveBeenCalled()
  })

  it("retries only the Locality after the State was created", async () => {
    api.createState.mockResolvedValue({
      data: { id: "state-id", display_name: "Jalisco", created_at: "" },
      status: 201,
    })
    api.createLocality
      .mockResolvedValueOnce({ data: undefined, status: 500 })
      .mockResolvedValueOnce({
        data: {
          id: "locality-id",
          state_id: "state-id",
          display_name: "Guadalajara",
          created_at: "",
        },
        status: 201,
      })

    await fillValidForm()
    submitForm()

    const retryButton = await screen.findByRole("button", {
      name: "Reintentar localidad",
    })
    fireEvent.click(retryButton)

    await waitFor(() => expect(api.createLocality).toHaveBeenCalledTimes(2))
    expect(api.createState).toHaveBeenCalledTimes(1)
    expect(api.createLocality).toHaveBeenLastCalledWith("state-id", {
      display_name: "Guadalajara",
    })
  })
})
