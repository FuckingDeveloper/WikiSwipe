import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#eff4ff",
        muted: "#a0b0c9",
        brand: "#49c6ff",
        positive: "#54d19d",
        negative: "#ff6f7a",
        panel: "#0f1728",
        panelSoft: "#162238"
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"]
      },
      boxShadow: {
        glow: "0 22px 60px rgba(0, 0, 0, 0.45)",
        soft: "0 18px 50px rgba(34, 99, 163, 0.25)"
      }
    }
  },
  plugins: []
};

export default config;
