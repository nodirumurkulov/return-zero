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
            "Do not use an IIFE to initialize a variable. Use a named function or a lib/api helper.",
        },
        {
          selector:
            "VariableDeclarator > CallExpression[callee.type='FunctionExpression']",
          message:
            "Do not use an IIFE to initialize a variable. Use a named function or a lib/api helper.",
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
    files: ["lib/slack.ts", "app/error.tsx"],
    rules: { "no-console": "off" },
  },
);
