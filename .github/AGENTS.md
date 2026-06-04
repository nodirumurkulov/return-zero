# .github/

CI workflows. PRs must pass **`frontend` CI** (Bun: install, lint, typecheck, build).

- `workflows/ci.yml` — main gate

Do not weaken lint or skip checks without team agreement. Optional Supabase row-count validation may run separately when secrets are configured.
