/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#18251f",
        moss: "#2f6b4f",
        leaf: "#54a474",
        cream: "#f7f5ee",
        sun: "#f5b942"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        display: ["Manrope", "Inter", "ui-sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 60px rgba(24,37,31,.10)"
      }
    }
  },
  plugins: []
};
