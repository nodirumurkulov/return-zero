#!/usr/bin/env bash
# verify-secrets.sh — fail the build if a server-only secret can leak into the
# client bundle. Run via `npm run verify:secrets` (RUN-29).
#
# Checks:
#   1. No server-only secret env var is referenced inside a "use client" file.
#   2. No secret is accidentally exposed through a NEXT_PUBLIC_ prefix.
set -euo pipefail

# Run from the frontend/ root regardless of where the script is invoked.
cd "$(dirname "$0")/.."

SECRETS="SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|SLACK_WEBHOOK_URL|SLACK_SIGNING_SECRET"
fail=0

# 1. Secrets must never appear in a Client Component.
client_files=$(grep -rl '"use client"' --include='*.ts' --include='*.tsx' app components lib 2>/dev/null || true)
for f in $client_files; do
  if grep -nE "process\.env\.($SECRETS)" "$f"; then
    echo "ERROR: server-only secret referenced in client component: $f"
    fail=1
  fi
done

# 2. Secrets must never be exposed via the NEXT_PUBLIC_ prefix (shipped to browser).
if grep -rnE "NEXT_PUBLIC_($SECRETS)" --include='*.ts' --include='*.tsx' app components lib 2>/dev/null; then
  echo "ERROR: server-only secret exposed with NEXT_PUBLIC_ prefix"
  fail=1
fi

if [ "$fail" -ne 0 ]; then
  echo "verify:secrets FAILED — server-only secrets are reachable from the client."
  exit 1
fi

echo "verify:secrets OK — no server-only secrets reachable from client code."
