/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0EA5E9", // Sky Blue
        secondary: "#F9FAFB", // Soft background
        accent: "#22D3EE", // Cyan accent
        text: "#1F2937", // Gray-800 text
        error: "#EF4444", // Red
        bgLight: "#FFFFFF", // White
      },
      fontFamily: {
        inter: ["Inter", "Arial", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
