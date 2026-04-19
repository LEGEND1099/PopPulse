import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#12080c",
        panel: "#241015",
        muted: "#c7b5a7",
        line: "rgba(254, 205, 211, 0.14)",
        accent: "#fb7185",
        accentStrong: "#ef4444",
        warm: "#f59e0b",
        danger: "#f97316",
      },
      boxShadow: {
        panel: "0 18px 40px rgba(2, 10, 23, 0.32)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      backgroundImage: {
        aurora:
          "radial-gradient(circle at top left, rgba(251, 113, 133, 0.18), transparent 28%), radial-gradient(circle at top right, rgba(245, 158, 11, 0.14), transparent 24%), linear-gradient(160deg, #12080c 0%, #1d0d12 45%, #2a1418 100%)",
      },
      fontFamily: {
        display: ['"Tan St Canard"', '"Cooper Black"', '"Bookman Old Style"', "serif"],
        body: ["var(--font-manrope)"],
      },
    },
  },
  plugins: [],
};

export default config;
