import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ["var(--font-dm-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-dm-serif)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#4a3d72",
          dark:    "#3a2f5c",
          light:   "#f0edf8",
        },
        linen: {
          DEFAULT: "#eae7de",
          dark:    "#e0ddd5",
          light:   "#f5f3f0",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
