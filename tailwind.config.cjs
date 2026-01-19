/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
    './App.tsx'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif']
      }
    }
  },
  plugins: []
};
