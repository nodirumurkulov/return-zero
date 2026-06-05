import { learnResponseSchema } from "@/lib/stores/analytics/learn/schemas";

import { apiClient } from "../client";

export async function postLearn(): Promise<void> {
  const data = await apiClient("/api/learn", {
    method: "POST",
    body: {},
    output: learnResponseSchema,
  });
  if (!("success" in data) || !data.success) {
    const message = "error" in data ? data.error : "Analysis failed";
    throw new Error(message);
  }
}
