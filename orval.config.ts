import { defineConfig } from "orval"
// oxlint-disable-next-line import/no-unassigned-import
import "dotenv/config"

let env = process.env.ENVIRONMENT || "DEVELOPMENT"

if (!env) throw new Error("Please define ENVIRONEMT env var")

env = env.toUpperCase()

const SOURCE_INPUT_URL = {
  DEVELOPMENT: "http://localhost:8080",
  PRODUCTION: "https://cloud.bikestop.com.mx",
} as Record<string, string>

console.log("You are executing orval from:", env, SOURCE_INPUT_URL[env])

const auth = Buffer.from(`admin:password`).toString("base64")

export default defineConfig({
  cicloSwr: {
    input: {
      target: SOURCE_INPUT_URL[env] + "/docs/openapi.json",
      parserOptions: {
        headers: [
          {
            domains: ["localhost"],
            headers: {
              Authorization: `Basic ${auth}`,
            },
          },
        ],
      },
    },
    output: {
      target: "./src/lib/api/api.ts",
      schemas: "./src/lib/api/schemas",
      client: "swr",
      //biome: true,
      baseUrl: SOURCE_INPUT_URL[env],
      override: {
        requestOptions: {
          credentials: "include",
        },
      },
    },
  },
  cicloZod: {
    input: SOURCE_INPUT_URL[env] + "/docs/openapi.json",
    output: {
      target: "./src/lib/api/zods.ts",
      client: "zod",
      //biome: true,
    },
  },
})
