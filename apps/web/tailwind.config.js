/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        safir: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc7fc",
          400: "#36abf7",
          500: "#0c8ee9",
          600: "#0170c7",
          700: "#0259a1",
          800: "#064b85",
          900: "#0b3f6f",
          950: "#07284a",
        },
      },
    },
  },
  plugins: [],
};
