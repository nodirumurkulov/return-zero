# Dependency Security

Automated scanning for vulnerable and malicious dependencies.

## Why scan dependencies?

npm packages are a major attack vector. A single compromised dependency can:

- **Steal secrets** — read environment variables and exfiltrate API keys
- **Backdoor the app** — inject malicious code into the production bundle
- **Crypto-mine** — abuse CI/server CPU during install scripts
- **Supply chain attack** — compromise a popular package to reach thousands of apps

## Defense layers

### 1. Snyk (SCA — Software Composition Analysis)

[Snyk](https://snyk.io) scans `package.json` and the dependency tree for known CVEs.

**In CI** (`.github/workflows/security.yml`):
- `snyk test` runs on every PR — reports high+ severity vulnerabilities
- `snyk monitor` runs on `main` pushes — uploads the dependency snapshot to the Snyk dashboard for ongoing tracking
- Set as `continue-on-error: true` — reports issues without blocking PRs (vulnerabilities are tracked, not gated)

**Severity threshold**: `--severity-threshold=high` — only high and critical vulnerabilities are flagged.

### 2. Gitleaks (secret scanning)

Scans every commit in the PR for accidentally committed secrets. See `docs/secrets-policy.md` for details.

### 3. Weekly schedule

The security workflow runs weekly (Monday 08:00 UTC) even without PRs, catching newly disclosed vulnerabilities in existing dependencies.

## Reading Snyk results

When Snyk finds vulnerabilities:

1. Check the Snyk dashboard (linked in the CI output) for full details
2. Each vulnerability shows: package, severity, fix version, and exploit maturity
3. Priority: fix "exploitable" + "high/critical" first

## Common fixes

| Fix | Command |
|-----|---------|
| Update a specific package | `bun update <package>` |
| Update all dependencies | `bun update` |
| Check what's outdated | `bun outdated` |
| Ignore a false positive | Add to `.snyk` policy file |

## Snyk token

The `SNYK_TOKEN` secret must be configured in GitHub repository settings → Secrets → Actions. Get a token from [snyk.io/account](https://app.snyk.io/account).
