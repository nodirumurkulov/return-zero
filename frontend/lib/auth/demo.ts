export const DEMO_USER_EMAIL_DEFAULT = "demo@example.test";
export const DEMO_USER_PASSWORD_DEFAULT = "change-me";

/** Credentials for the Hugo mock store one-click demo account (server-only). */
export function resolveDemoCredentials():
  | { email: string; password: string }
  | null {
  const email = process.env.DEMO_USER_EMAIL;
  const password = process.env.DEMO_USER_PASSWORD;
  if (email && password) {
    return { email, password };
  }
  if (process.env.NODE_ENV !== "production") {
    return {
      email: DEMO_USER_EMAIL_DEFAULT,
      password: DEMO_USER_PASSWORD_DEFAULT,
    };
  }
  return null;
}
