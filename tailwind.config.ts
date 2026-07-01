import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        bg: "var(--color-bg)",
        panel: "var(--color-panel)",
        elevated: "var(--color-elevated)",
        line: "var(--color-line)",
        fg: {
          DEFAULT: "var(--color-fg)",
          muted: "var(--color-fg-muted)",
          faint: "var(--color-fg-faint)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          strong: "var(--color-accent-strong)",
          soft: "var(--color-accent-soft)",
          ring: "var(--color-accent-ring)",
          on: "var(--color-on-accent)",
          "on-soft": "var(--color-on-accent-soft)",
        },
        conf: {
          low: "var(--color-low)",
          "low-soft": "var(--color-low-soft)",
          "low-ring": "var(--color-low-ring)",
          medium: "var(--color-medium)",
          "medium-soft": "var(--color-medium-soft)",
          "medium-ring": "var(--color-medium-ring)",
          high: "var(--color-high)",
          "high-soft": "var(--color-high-soft)",
          "high-ring": "var(--color-high-ring)",
        },
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
        "in-out": "var(--ease-in-out)",
      },
    },
  },
  plugins: [],
};

export default config;
