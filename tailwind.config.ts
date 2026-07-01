import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        terminal: {
          bg: "#0a0e14",
          panel: "#0f1520",
          border: "#1f2937",
          accent: "#38bdf8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
