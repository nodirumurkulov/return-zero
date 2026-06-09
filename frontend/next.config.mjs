/**
 * Security headers applied to every response.
 *
 * Content-Security-Policy (CSP) — controls which origins the browser may load
 * resources from. Each directive limits one resource type:
 *
 *   default-src 'self'          — fallback: only same-origin unless overridden
 *   script-src  'self' 'unsafe-inline'
 *       Next.js injects inline <script> tags for page hydration data.
 *       A nonce-based policy is stricter but requires middleware changes (Phase 2).
 *   style-src   'self' 'unsafe-inline' https://fonts.googleapis.com
 *       Inline <style> tags exist in the marketing layout and HugoLanding.
 *       Google Fonts stylesheet is loaded from fonts.googleapis.com.
 *   font-src    'self' https://fonts.gstatic.com
 *       Google Fonts serves font files from fonts.gstatic.com.
 *   img-src     'self' data: blob:
 *       data: URIs for small inline images; blob: for client-generated previews.
 *   connect-src 'self' https://*.supabase.co wss://*.supabase.co
 *       Supabase REST + Realtime (WebSocket) connections.
 *   frame-src   'none'          — no iframes allowed (prevents clickjacking via embedding)
 *   object-src  'none'          — blocks Flash/Java plugins (legacy attack surface)
 *   base-uri    'self'          — prevents <base> tag hijacking (XSS payload technique)
 *   form-action 'self'          — forms can only submit to same origin
 *
 * Other headers:
 *   Strict-Transport-Security  — forces HTTPS; prevents SSL-stripping MITM
 *   X-Content-Type-Options     — stops browsers guessing MIME types (drive-by download defense)
 *   X-Frame-Options            — legacy clickjacking protection (CSP frame-ancestors supersedes)
 *   Referrer-Policy            — limits URL leakage to third parties
 *   Permissions-Policy         — disables device APIs the app does not use
 *   X-DNS-Prefetch-Control     — prevents speculative DNS lookups that leak visited hostnames
 */

const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Playwright uses http://127.0.0.1:3000; without this, dev HMR/actions can break.
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    turbopackFileSystemCacheForBuild: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
