/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,ts}"],
  theme: {
    extend: {
      colors: {
        paper: "#ffffff",
        "paper-2": "#f5f4f1",
        ink: "#17140f",
        "ink-soft": "#57534a",
        line: "#e4e0d7",
        accent: "#a13e2b",
        "accent-soft": "#c96a4f",
      },
      fontFamily: {
        serif: [
          "Iowan Old Style",
          "Palatino Linotype",
          "Palatino",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
