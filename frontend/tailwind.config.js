/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pf: {
          black:    "#0A0A0A",
          white:    "#FAFAFA",
          cream:    "#F5F0E8",
          sage:     "#8A9E8A",
          charcoal: "#2C2C2C",
          dust:     "#E8E3DA",
        },
        grade: {
          f: "#DC2626",
          d: "#EA580C",
          c: "#CA8A04",
          b: "#2563EB",
          a: "#16A34A",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)",  "Courier New",  "monospace"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter:  "-0.03em",
        label:    "0.08em",
        wide:     "0.12em",
      },
    },
  },
  plugins: [],
};
