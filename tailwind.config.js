/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
      '100': '25rem',
      '120': '30rem',
      '160': '40rem',// Adds a new spacing size
    }},
  },
  plugins: [],
}