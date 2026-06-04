/** @type {import('next').NextConfig} */
const nextConfig = {
  // Playwright uses http://127.0.0.1:3000; without this, dev HMR/actions can break.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
