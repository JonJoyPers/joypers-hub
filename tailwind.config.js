/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: "#1A1A1A",
          mid: "#2A2A2A",
          light: "#333333",
        },
        cream: {
          DEFAULT: "#F5F5DC",
          muted: "#C4C4A8",
        },
        teal: {
          DEFAULT: "#008080",
          light: "#4DB6AC",
          dark: "#005F5F",
        },
        amber: "#F59E0B",
        rose: "#F472B6",
        violet: "#A78BFA",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
