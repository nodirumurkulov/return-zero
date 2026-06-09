# CI Hardening

Supply chain security measures applied to GitHub Actions CI.

## SHA-pinned actions

All third-party GitHub Actions are pinned to exact commit SHAs instead of mutable version tags (`v4`, `v2`, etc.):

```yaml
# Before — mutable tag, can be overwritten by the maintainer
- uses: actions/checkout@v4

# After — immutable SHA, always runs the same code
- uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4
```

### Why pin by SHA?

Version tags in GitHub Actions are **mutable** — the repository owner can move them to point at any commit. This means:

1. **Supply chain attack**: if the action's repo is compromised, the attacker updates the `v4` tag to point at malicious code. Every workflow using `@v4` now runs the attacker's code.
2. **Silent changes**: even without malicious intent, a tag update might introduce breaking changes or new behavior you didn't audit.

A SHA is **immutable** — it always resolves to the same code. The comment `# v4` preserves readability while the SHA provides security.

### Pinned actions

| Action | SHA | Version |
|--------|-----|---------|
| `actions/checkout` | `34e114876b…` | v4 |
| `oven-sh/setup-bun` | `0c5077e514…` | v2 |
| `actions/cache` | `0057852bfa…` | v4 |
| `supabase/setup-cli` | `ab058987d8…` | v1 |
| `actions/upload-artifact` | `ea165f8d65…` | v4 |

### Updating pinned actions

When updating to a new version:

1. Find the new tag's SHA: `git ls-remote https://github.com/<owner>/<repo>.git refs/tags/<tag>`
2. Or check the CI job logs — GitHub logs the SHA when downloading actions
3. Update the SHA and the version comment together

## Least-privilege permissions

The workflow declares top-level `permissions: contents: read` — the minimum needed for checkout and cache. This follows the principle of least privilege:

- If a job is compromised, the `GITHUB_TOKEN` can only read repository contents
- No write access to contents, issues, PRs, packages, or deployments
- Individual jobs can escalate permissions if needed (e.g., `permissions: contents: write` for a release job)

## CODEOWNERS

`.github/CODEOWNERS` requires review approval for security-sensitive paths:

- `.github/` — workflow changes
- `frontend/proxy.ts`, `frontend/lib/csrf.ts` — auth and CSRF middleware
- `frontend/supabase/` — database migrations and RLS policies
- `.env.example` — secret configuration
- Security documentation

This prevents drive-by changes to critical security infrastructure.

## Future improvements

1. **Dependabot for Actions** — auto-PR when pinned SHAs have newer versions
2. **Required status checks** — enforce that lint/typecheck/test/build must pass before merge
3. **Branch protection** — require PR reviews, no force push to main
