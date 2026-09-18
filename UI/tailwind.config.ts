import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#14171C",
        "ink-raised": "#1B1F26",
        parchment: "#F6F1E7",
        "parchment-raised": "#EEE6D4",
        accent: "#1B3A5C",
        "accent-light": "#3E6690",
        wax: "#6B2E2E",
        stone: "#8A8578",
        "stone-light": "#B8B2A2",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-source-sans)", "sans-serif"],
      },
      maxWidth: {
        prose: "42rem",
      },
    },
  },
  plugins: [],
};
export default config;
