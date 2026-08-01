import stylistic from "@stylistic/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      stylistic,
    },
    rules: {
      "stylistic/semi": ["error", "always"],
      "stylistic/no-extra-semi": "error",
    },
  },
  {
    ignores: [
      "dist",
      "node_modules",
      "src/routeTree.gen.ts",
      "src/lib/api/**",
      "src/components/ui/**",
    ],
  },
];
