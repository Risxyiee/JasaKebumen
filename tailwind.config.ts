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
        /* Palet mengikuti logo JasaKebumen (monokrom hitam) — bukan hijau.
           Skala ink: dari putih kertas s.d. hitam pekat, dipetakan ke nama
           warna lama (green/emerald) agar seluruh kelas ikut berubah otomatis
           tanpa menyentuh ratusan pemakaian. */
        green: { DEFAULT: "#0B0B0C", dark: "#050506", tint: "#F4F4F3" },
        emerald: {
          50: "#FAFAFA",
          100: "#F4F4F5",
          200: "#E4E4E7",
          300: "#D4D4D8",
          400: "#A1A1AA",
          500: "#71717A",
          600: "#52525B",
          700: "#3F3F46",
          800: "#27272A",
          900: "#18181B",
          950: "#0A0A0B",
        },
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
