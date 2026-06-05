import { businessProfileInputSchema, saveProfileSuccessSchema } from "@/lib/settings/schemas";
import type { BusinessProfileInput } from "@/lib/settings/schemas";

export type PostBusinessProfileInput = {
  readonly profile: BusinessProfileInput;
};

export async function postBusinessProfile(input: PostBusinessProfileInput): Promise<void> {
  const body = businessProfileInputSchema.parse(input.profile);
  const res = await fetch("/api/onboarding/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json: unknown = await res.json();
  if (!res.ok) {
    const message =
      typeof json === "object" && json && "error" in json ? String(json.error) : "Save failed";
    throw new Error(message);
  }
  const parsed = saveProfileSuccessSchema.safeParse(json);
  if (!parsed.success) throw new Error("Invalid save response");
}
