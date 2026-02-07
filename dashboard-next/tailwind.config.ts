import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#020617",
          gold: "#fbbf24",
          slate: "#f8fafc",
        }
      }
    },
  },
  plugins: [],
};
export default config;
