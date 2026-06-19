/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          950: "rgb(var(--surface-950) / <alpha-value>)",
          900: "rgb(var(--surface-900) / <alpha-value>)",
          850: "rgb(var(--surface-850) / <alpha-value>)",
          800: "rgb(var(--surface-800) / <alpha-value>)",
        },
        signal: {
          cyan: "rgb(var(--signal-cyan) / <alpha-value>)",
          lime: "rgb(var(--signal-lime) / <alpha-value>)",
          amber: "rgb(var(--signal-amber) / <alpha-value>)",
          red: "rgb(var(--signal-red) / <alpha-value>)",
        },
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
      },
    },
  },
  plugins: [],
};
