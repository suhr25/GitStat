import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: { extend: { colors: { ink: "#171717", accent: "#4f46e5" } } },
  plugins: [],
} satisfies Config;
