"use client";

import { useMutation } from "@tanstack/react-query";

import { postLearn } from "@/lib/api/stores/learn/client";

export function useRunLearn() {
  return useMutation({
    mutationFn: postLearn,
  });
}
