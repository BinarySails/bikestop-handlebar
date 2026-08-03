import { expect, test } from "vitest";
import { cn } from "./utils";

test("cn merges tailwind classes", () => {
  expect(cn("px-2", "px-4")).toBe("px-4");
});
