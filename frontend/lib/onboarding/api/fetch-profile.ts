import type { z } from "zod";

import { businessProfileResponseSchema } from "@/lib/settings/schemas";

export type BusinessProfileData = z.infer<typeof businessProfileResponseSchema>;

export async function fetchBusinessProfile(): Promise<BusinessProfileData> {
  const res = await fetch("/api/onboarding/profile");
  const json: unknown = await res.json();
  if (!res.ok) {
    const message =
      typeof json === "object" && json && "error" in json ? String(json.error) : "Failed to load profile";
    throw new Error(message);
  }
  const parsed = businessProfileResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Invalid profile response");
  return parsed.data;
}
