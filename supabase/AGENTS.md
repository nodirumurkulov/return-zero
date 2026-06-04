# AGENTS.md — supabase

Postgres schema, views, RPCs, RLS. **Parent:** [../AGENTS.md](../AGENTS.md) · **Humans:** [README.md](README.md)

## Setup commands

```bash
supabase link                    # once per machine
supabase db push                 # apply migrations
```

## Layout

| Path | Role |
|------|------|
| `migrations/` | Ordered SQL — never edit old files in place |
| `tests/` | RLS tests + `run_rls_test.sh` if present |
| `config.toml` | Local Supabase config |

## Rules

- New schema change → **new migration file** only.
- When columns change, update matching types in `frontend/lib/<domain>/types.ts` in the same PR.
- Frontend uses service role on the server; RLS still matters for anon paths and tests.

## Testing

```bash
# after local supabase up, if tests exist:
./tests/run_rls_test.sh
```

After seed: `cd scripts && npm run validate`
