/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#6366f1',
        surface: '#1e293b',
        bg: '#0f172a',
      },
    },
  },
  plugins: [],
};
