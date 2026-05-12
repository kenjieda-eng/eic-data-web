import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1e293b",
        subink: "#475569",
        faint: "#64748b",
        paper: "#f8fafc",
        accent: {
          DEFAULT: "#10b981",
          dark: "#047857",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-noto-jp)",
          "var(--font-inter)",
          "system-ui",
          "sans-serif",
        ],
        mono: ["ui-monospace", "monospace"],
      },
    },
  },
} satisfies Config;
