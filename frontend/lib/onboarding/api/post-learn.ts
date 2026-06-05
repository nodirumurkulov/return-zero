import { learnResponseSchema } from "@/lib/learn/schemas";

export async function postLearn(): Promise<void> {
  const res = await fetch("/api/learn", { method: "POST" });
  const json: unknown = await res.json();
  const parsed = learnResponseSchema.safeParse(json);
  if (!res.ok || !parsed.success || !("success" in parsed.data && parsed.data.success)) {
    const message =
      parsed.success && "error" in parsed.data ? parsed.data.error : "Analysis failed";
    throw new Error(message);
  }
}
