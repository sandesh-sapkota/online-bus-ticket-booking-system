/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1F2937',
        secondary: '#10B981',
        accent: '#F59E0B',
        dark: '#111827',
        light: '#F9FAFB',
      }
    },
  },
  plugins: [],
}
