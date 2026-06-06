import { createFetch } from "@better-fetch/fetch";

import { ApiError } from "./errors";

export const apiClient = createFetch({
  baseURL: "",
  headers: { "Content-Type": "application/json" },
  throw: true,
  onError: async (context) => {
    const body: unknown =
      context.error?.error ??
      (await context.response
        .clone()
        .json()
        .catch(() => undefined));
    throw ApiError.fromBody(context.response.status, body, context.response.statusText);
  },
});
