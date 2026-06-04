/** Safe in-app path for post-auth redirects (blocks open redirects). */
export function safeRedirectPath(next: FormDataEntryValue | null): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) {
    return "/catalog";
  }
  return next;
}
