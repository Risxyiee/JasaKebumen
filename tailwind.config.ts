import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF9F6",
        ink: "#1C1917",
        mute: "#57534E",
        faint: "#78716C", // WCAG AA — jangan turunkan lagi
        line: "#E7E4DE",
        green: { DEFAULT: "#064E3B", dark: "#04382B", tint: "#EDF3EF" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        mono: ["var(--font-jbmono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
