import "server-only";

import { tool } from "ai";

import { finalResponseInputSchema } from "../schemas";

export function createFinalResponseTool() {
  return {
    finalResponse: tool({
      description:
        "Submit the final Slack reply for the user. Call this once you have gathered data or completed an action.",
      inputSchema: finalResponseInputSchema,
      execute: ({ message }) => ({ message }),
    }),
  };
}
