# Hackathon materials

Everything for the **Wayflyer × Fin Hackathon** (3–5 June 2026) and the **Pretty Fly** demo dataset — kept separate from app code (`frontend/`, `supabase/`).

## Contents

| Path | Description |
|------|-------------|
| [data-pack/](data-pack/) | Pretty Fly CSVs, Python validator, data dictionary |
| [participant-readme.pdf](participant-readme.pdf) | Official hackathon participant brief (PDF) |
| [judge-demo.md](judge-demo.md) | 5-minute live demo script |
| [deploy-checklist.md](deploy-checklist.md) | Vercel deploy + post-deploy smoke checks |
| [visual-parity.md](visual-parity.md) | UI parity checklist vs internal prototype |

## Load data into Hugo

After Supabase migrations:

```bash
cd frontend && bun install
bun run seed
bun run validate
```

See [data-pack/README.md](data-pack/README.md) for CSV layout and row-count expectations.

## Live demo

[return-zero on Vercel](https://return-zero-57ht-nodir-s-projects1.vercel.app) — walkthrough in [judge-demo.md](judge-demo.md).

**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
