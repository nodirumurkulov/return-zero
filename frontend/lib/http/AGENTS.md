# lib/http/

Shared HTTP helpers (not a domain).

- `parse-json.ts` — `parseRequestJson(req, schema, fallback?)` for route handlers

Domain routes import schemas from `lib/<domain>/schemas.ts`, not from here.
