"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchBusinessProfile } from "@/lib/onboarding/api";
import { onboardingKeys } from "@/lib/onboarding/api/onboarding-query-keys";

export function useBusinessProfile() {
  return useQuery({
    queryKey: onboardingKeys.profile(),
    queryFn: fetchBusinessProfile,
  });
}
