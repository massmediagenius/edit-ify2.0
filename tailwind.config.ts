import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0F1115",
        surface: "#1A1D24",
        "surface-raised": "#21252E",
        border: "#2A2D35",
        "accent-cyan": "#00E5FF",
        "accent-purple": "#A855F7",
        "accent-green": "#22C55E",
        "accent-orange": "#F97316",
        "accent-yellow": "#EAB308",
        "text-primary": "#F1F5F9",
        "text-secondary": "#94A3B8",
        "text-muted": "#475569",
      },
      fontFamily: {
        heading: ["var(--font-jakarta)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(0, 229, 255, 0.15), 0 0 40px rgba(0, 229, 255, 0.05)",
        "glow-cyan-md": "0 0 30px rgba(0, 229, 255, 0.25), 0 0 60px rgba(0, 229, 255, 0.1)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
