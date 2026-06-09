# Security Headers

HTTP security headers configured in `frontend/next.config.mjs`, applied to every response via the Next.js `headers()` config.

## Headers

### Content-Security-Policy (CSP)

Controls which origins the browser may load resources from. If an attacker injects a `<script>` tag (XSS), the browser refuses to execute it unless the origin is allowlisted.

| Directive | Value | What it prevents |
|-----------|-------|-----------------|
| `default-src` | `'self'` | Fallback: blocks any resource type not explicitly listed |
| `script-src` | `'self' 'unsafe-inline'` | XSS via injected scripts. `unsafe-inline` is required because Next.js injects inline `<script>` for hydration data. **Upgrade path:** nonce-based CSP via middleware (removes `unsafe-inline`) |
| `style-src` | `'self' 'unsafe-inline' fonts.googleapis.com` | Style injection. `unsafe-inline` needed for inline `<style>` in marketing layout + HugoLanding |
| `font-src` | `'self' fonts.gstatic.com` | Blocks unauthorized font loading (exfiltration via `@font-face`) |
| `img-src` | `'self' data: blob:` | Image-based data exfiltration. `data:` for inline SVGs; `blob:` for client-generated previews |
| `connect-src` | `'self' *.supabase.co wss://*.supabase.co` | XHR/fetch/WebSocket to unauthorized origins. Allows Supabase REST + Realtime |
| `frame-src` | `'none'` | Clickjacking via `<iframe>` embedding of third-party content |
| `object-src` | `'none'` | Flash/Java plugin attacks (legacy but still required by security scanners) |
| `base-uri` | `'self'` | `<base>` tag hijacking — an XSS technique that redirects all relative URLs |
| `form-action` | `'self'` | Cross-origin form submissions (CSRF variant) |

### Strict-Transport-Security (HSTS)

```
max-age=63072000; includeSubDomains; preload
```

Forces HTTPS for 2 years. Prevents SSL-stripping man-in-the-middle attacks where an attacker downgrades HTTPS → HTTP to intercept traffic. `preload` allows submission to the [HSTS preload list](https://hstspreload.org/).

### X-Content-Type-Options

```
nosniff
```

Prevents MIME-sniffing — stops the browser from interpreting a JSON or text response as executable HTML/JS. Mitigates drive-by download and content-type confusion attacks.

### X-Frame-Options

```
DENY
```

Legacy clickjacking protection. Prevents the app from being embedded in an `<iframe>` on a malicious site that tricks users into clicking hidden buttons (e.g., the "Approve incident" button). Superseded by CSP `frame-ancestors` but still needed for older browsers.

### Referrer-Policy

```
strict-origin-when-cross-origin
```

Controls the `Referer` header sent with outbound requests. Same-origin requests send the full URL (useful for debugging); cross-origin requests send only the origin (e.g., `https://app.example.com` — not the full path). Prevents leaking internal URLs to third-party services.

### Permissions-Policy

```
camera=(), microphone=(), geolocation=(), interest-cohort=()
```

Disables device APIs the app does not use. Even if XSS is achieved, the attacker cannot activate the camera, mic, or geolocation. `interest-cohort=()` opts out of Google's FLoC tracking.

### X-DNS-Prefetch-Control

```
off
```

Prevents speculative DNS lookups. Browsers may prefetch DNS for links on the page, which leaks information about which hostnames appear in the HTML to the DNS resolver.

## Future improvements

1. **Nonce-based CSP** — Remove `unsafe-inline` from `script-src` by generating a per-request nonce in middleware and injecting it into Next.js. This is the gold standard for XSS prevention.
2. **CSP reporting** — Add `report-uri` or `report-to` directive to collect CSP violations for monitoring.
3. **`frame-ancestors 'none'`** — Add the CSP equivalent of `X-Frame-Options` for modern browsers.
