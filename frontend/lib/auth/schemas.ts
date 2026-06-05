import { z } from "zod";

/** Relative in-app path only (blocks open redirects). */
export const authNextPathSchema = z
  .string()
  .startsWith("/")
  .refine((path) => !path.startsWith("//"), "Protocol-relative URLs are not allowed");

export const AUTH_NEXT_DEFAULT = "/catalog" as const;
