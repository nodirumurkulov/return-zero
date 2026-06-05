import { execFileSync, execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const supabaseDir = path.join(frontendRoot, "supabase");
const sqlFile = path.join(supabaseDir, "tests/rls_policies_test.sql");

const envOut = execSync("supabase status -o env", { cwd: supabaseDir, encoding: "utf8" });
const dbUrlLine = envOut.split("\n").find((line) => line.startsWith("DB_URL="));
if (!dbUrlLine) {
  throw new Error("DB_URL missing from supabase status — start local Supabase first");
}
const dbUrl = dbUrlLine.slice("DB_URL=".length).replace(/^'|'$/g, "");

execFileSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-f", sqlFile], { stdio: "inherit" });
