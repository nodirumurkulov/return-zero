function isSafeAppPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

/** Safe in-app path for post-auth redirects (blocks open redirects). */
export function safeRedirectPath(next: FormDataEntryValue | null): string {
  if (typeof next !== "string" || !isSafeAppPath(next)) {
    return "/catalog";
  }
  return next;
}

/** Safe in-app path from a URL search param (OAuth callback). */
export function safeRedirectPathFromQuery(next: string | null): string {
  if (!next || !isSafeAppPath(next)) {
    return "/catalog";
  }
  return next;
}
