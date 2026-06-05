import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          subtle: "hsl(var(--primary-subtle))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: {
          DEFAULT: "hsl(var(--ring))",
          primary: "hsl(var(--primary-ring))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Severity tints — flat camelCase keys so prototype classes resolve
        // exactly: text-sev-critical / bg-sev-criticalBg / border-sev-criticalBd.
        sev: {
          critical: "hsl(var(--sev-critical))",
          criticalBg: "hsl(var(--sev-critical-bg))",
          criticalBd: "hsl(var(--sev-critical-bd))",
          high: "hsl(var(--sev-high))",
          highBg: "hsl(var(--sev-high-bg))",
          highBd: "hsl(var(--sev-high-bd))",
          monitor: "hsl(var(--sev-medium))",
          monitorBg: "hsl(var(--sev-monitor-bg))",
          monitorBd: "hsl(var(--sev-monitor-bd))",
          resolved: "hsl(var(--sev-low))",
          resolvedBg: "hsl(var(--sev-resolved-bg))",
          resolvedBd: "hsl(var(--sev-resolved-bd))",
          idle: "hsl(var(--sev-idle))",
          idleBg: "hsl(var(--sev-idle-bg))",
          idleBd: "hsl(var(--sev-idle-bd))",
          // legacy aliases (untouched components)
          medium: "hsl(var(--sev-medium))",
          low: "hsl(var(--sev-low))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        pop: "var(--shadow-pop)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
