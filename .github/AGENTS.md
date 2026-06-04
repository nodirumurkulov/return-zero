# AGENTS.md — .github

CI configuration. **Parent:** [../AGENTS.md](../AGENTS.md) · **Humans:** [README.md](README.md)

## CI workflow

[workflows/ci.yml](workflows/ci.yml) runs on PRs and pushes to `main`:

```bash
cd frontend && bun ci && bun run lint && bun run typecheck && bun run build
```

Uses placeholder Clerk/Supabase env vars — enough to build, not to hit real APIs.

## Pull request rules

- Do not disable or weaken CI checks without explicit user request.
- Do not add `continue-on-error` to lint/typecheck/build steps.
- Scripts validators are **not** in CI (need live DB).

## Before pushing

Match CI locally:

```bash
cd frontend && bun run check && bun run build
```
