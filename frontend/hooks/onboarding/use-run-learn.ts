"use client";

import { useMutation } from "@tanstack/react-query";

import { postLearn } from "./api";

export function useRunLearn() {
  return useMutation({
    mutationFn: postLearn,
  });
}
