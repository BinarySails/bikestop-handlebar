// @vitest-environment jsdom
/* oxlint-disable vitest/require-mock-type-parameters */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ImageUploadField } from "./image-upload-field";

const api = vi.hoisted(() => ({ createFile: vi.fn() }));

vi.mock("@/lib/api/api", () => ({ createFileRequest: api.createFile }));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("ImageUploadField", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(File.prototype, "arrayBuffer", {
      configurable: true,
      value: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
    });
    Object.defineProperty(globalThis.crypto, "subtle", {
      configurable: true,
      value: {
        digest: vi.fn().mockResolvedValue(new Uint8Array(32).fill(1).buffer),
      },
    });
    api.createFile.mockResolvedValue({
      status: 201,
      data: {
        upload_url: "https://uploads.example.com/logo",
        public_url: "https://cdn.example.com/logo.png",
      },
    });
  });
  afterEach(cleanup);

  it("creates, uploads and returns the public image URL", async () => {
    const onChange = vi.fn();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    render(
      <ImageUploadField
        label="Imagen de la marca"
        value=""
        onChange={onChange}
      />
    );

    const file = new File(["image"], "logo.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Imagen de la marca"), {
      target: { files: [file] },
    });

    await waitFor(() =>
      expect(api.createFile).toHaveBeenCalledWith({
        checksum: "01".repeat(32),
        content_type: "image/png",
        file_name: "logo.png",
        file_type: "public",
        original_filename: "logo.png",
        size: file.size,
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://uploads.example.com/logo",
      expect.objectContaining({
        method: "PUT",
        body: file,
        headers: { "Content-Type": "image/png" },
      })
    );
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith("https://cdn.example.com/logo.png")
    );
  });
});
