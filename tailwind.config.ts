import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
          800: "#1e3a8a",
          900: "#172554",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
