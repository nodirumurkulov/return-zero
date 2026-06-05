"use client";

import { useMutation } from "@tanstack/react-query";

import { postLearn } from "@/lib/onboarding/api";

export function useRunLearn() {
  return useMutation({
    mutationFn: postLearn,
  });
}
