/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        panel: "#111C33",
        panelSoft: "#17223D",
        accent: "#F6C453",
        textHigh: "#F8FAFC",
        textMid: "#B6C2E2",
      },
      boxShadow: {
        glow: "0 18px 40px rgba(0, 0, 0, 0.22)",
      },
    },
  },
  plugins: [],
};

