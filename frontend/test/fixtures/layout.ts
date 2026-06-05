import type { ShellUser } from "@/components/layout/AppShell";

export function createShellUserFixture(overrides?: Partial<ShellUser>): ShellUser {
  return {
    id: "user-00000000-0000-0000-0000-000000000001",
    email: "ops@prettyfly.test",
    name: "Ops User",
    ...overrides,
  };
}
