/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      container: {
        center: true,
      },
      colors: {
        'main-blue': '#102b4e',
        'main-yellow': '#dcb42a'
      }
    },
  },
  plugins: [], // Không cần plugin line-clamp vì đã được tích hợp sẵn
};