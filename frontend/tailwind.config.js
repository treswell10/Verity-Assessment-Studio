/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1f3350",
        confirmed: "#2f7a4f",
        review: "#b5790b",
        error: "#b23b3b",
      },
    },
  },
  plugins: [],
};
