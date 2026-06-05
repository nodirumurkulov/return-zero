import { includeIgnoreFile } from "@eslint/compat";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import eslint from "@eslint/js";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import functional from "eslint-plugin-functional";
import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));
const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  {
    ignores: [
      "eslint.config.mjs",
      "next.config.mjs",
      "postcss.config.mjs",
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
      "functional/no-let": "error",
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
    files: ["scripts/**/*.ts", "e2e/fixtures/demo-data.ts"],
    rules: { "no-console": "off" },
  },
  {
    files: ["e2e/**/*.ts"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
  {
    files: ["lib/slack.ts", "lib/hugo/index.ts", "app/error.tsx", "lib/api-errors.ts"],
    rules: { "no-console": "off" },
  },
);
