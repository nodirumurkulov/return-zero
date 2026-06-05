import { learnResponseSchema } from "@/lib/stores";

import { apiClient } from "../../client";

export async function postLearn(): Promise<void> {
  const data = await apiClient("/api/stores/learn", {
    method: "POST",
    body: {},
    output: learnResponseSchema,
  });
  if (!("success" in data) || !data.success) {
    const message = "error" in data ? data.error : "Analysis failed";
    throw new Error(message);
  }
}
