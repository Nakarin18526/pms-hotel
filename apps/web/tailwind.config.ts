import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep teal as primary brand
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
          DEFAULT: "#0f766e",
          dark: "#115e59",
        },
        // Warm gold accent
        gold: {
          50: "#fdf8ed",
          100: "#fbecc6",
          200: "#f7d989",
          300: "#f3c14c",
          400: "#eea924",
          500: "#d68f15",
          600: "#b87111",
          700: "#945412",
          800: "#7a4316",
          900: "#683918",
          DEFAULT: "#b87111",
        },
        ivory: "#fbfaf6",
      },
      fontFamily: {
        serif: ["var(--font-display)", "Georgia", "serif"],
        sans: [
          "var(--font-body)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.05)",
        lift: "0 8px 32px rgba(15, 23, 42, 0.08)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
