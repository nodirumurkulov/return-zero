import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import eslint from "@eslint/js";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import functional from "eslint-plugin-functional";
import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "eslint.config.mjs",
      "next.config.mjs",
      "postcss.config.mjs",
      "scripts/**/*.ts",
      "e2e/**",
      "test/integration/**",
      "playwright.config.ts",
      "lib/supabase/database.types.ts",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
    },
  },
  {
    plugins: {
      functional,
      import: importPlugin,
    },
    rules: {
      // --- Strict style (RUN-71) ---
      "functional/no-let": "error",
      "functional/no-loop-statements": "off",
      "functional/immutable-data": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-duplicates": "error",
      "no-console": "warn",
      "prefer-const": "error",
      "no-var": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "VariableDeclarator > CallExpression[callee.type='ArrowFunctionExpression']",
          message:
            "Do not use an IIFE to initialize a variable. Use a named function at module scope.",
        },
        {
          selector:
            "VariableDeclarator > CallExpression[callee.type='FunctionExpression']",
          message:
            "Do not use an IIFE to initialize a variable. Use a named function at module scope.",
        },
      ],

      // Turn on in RUN-73 after Zod + typed Supabase rows per domain.
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-call": "off",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["lib/stores/**", "lib/agents/**", "lib/hugo/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/lib/stores/catalog/**",
                "@/lib/stores/incidents/**",
                "@/lib/stores/orders/**",
                "@/lib/stores/learn/**",
                "@/lib/stores/search/**",
                "@/lib/stores/metrics/**",
                "@/lib/stores/import/**",
              ],
              message: "Import from @/lib/stores (types/schemas) or @/lib/stores/server (getStore).",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "lib/agents/**/*.ts",
      "lib/cron-auth.ts",
      "lib/api-errors.ts",
      "lib/llm.ts",
      "lib/stores/catalog/health.ts",
      "lib/stores/catalog/forecast/methods.ts",
      "lib/stores/learn/schemas.ts",
      "lib/stores/import/schemas.ts",
      "lib/organizations/queries.ts",
      "lib/organizations/slack.ts",
      "lib/stores/catalog/queries.ts",
      "lib/stores/metrics/engine.ts",
    ],
    ignores: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-call": "error",
    },
  },
  {
    files: ["components/**/*.{ts,tsx}", "hooks/**/*.{ts,tsx}"],
    ignores: ["**/*.server.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/stores/server", "@/lib/stores/server/**"],
              message: "Server-only. Use @/lib/stores for types and schemas in client code.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["lib/slack.ts", "lib/hugo/index.ts", "app/error.tsx", "lib/api-errors.ts"],
    rules: { "no-console": "off" },
  },
);
