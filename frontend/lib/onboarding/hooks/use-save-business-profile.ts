"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { postBusinessProfile } from "@/lib/onboarding/api";
import { onboardingKeys } from "@/lib/onboarding/api/onboarding-query-keys";

export function useSaveBusinessProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postBusinessProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: onboardingKeys.profile() });
    },
  });
}
