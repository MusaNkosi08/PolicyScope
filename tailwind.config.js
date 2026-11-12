/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ps: {
          ink: "#0F172A",
          paper: "#F8FAFC",
          slate: "#111827",
          teal: "#0D9488",
          cyan: "#0891B2",
          indigo: "#6366F1",
          amber: "#D97706",
          rose: "#E11D48",
          muted: "#64748B",
          hairline: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "ps-gradient": "linear-gradient(135deg, #0D9488 0%, #0891B2 50%, #6366F1 100%)",
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};
