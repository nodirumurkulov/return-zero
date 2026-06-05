import { execFileSync, execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const supabaseDir = path.join(frontendRoot, "supabase");
const sqlFile = path.join(supabaseDir, "tests/rls_policies_test.sql");

function resolveDbUrl(envOut: string): string {
  const line = envOut.split("\n").find((entry) => entry.trimStart().startsWith("DB_URL="));
  if (!line) {
    throw new Error("DB_URL missing from supabase status — start local Supabase first");
  }

  const raw = line.trim().slice("DB_URL=".length).replace(/^["']|["']$/g, "");
  if (raw.startsWith("postgresql://") || raw.startsWith("postgres://")) {
    return raw;
  }
  if (raw.includes("://")) {
    return raw;
  }
  return `postgresql://postgres:postgres@${raw}`;
}

const envOut = execSync("supabase status -o env", { cwd: supabaseDir, encoding: "utf8" });
const dbUrl = resolveDbUrl(envOut);
const url = new URL(dbUrl);

const password = url.password;
const host = url.hostname;
const port = url.port || "5432";
const user = decodeURIComponent(url.username);
const database = url.pathname.replace(/^\//, "") || "postgres";

execFileSync(
  "psql",
  ["-h", host, "-p", port, "-U", user, "-d", database, "-v", "ON_ERROR_STOP=1", "-f", sqlFile],
  {
    stdio: "inherit",
    env: password ? { ...process.env, PGPASSWORD: password } : process.env,
  },
);
