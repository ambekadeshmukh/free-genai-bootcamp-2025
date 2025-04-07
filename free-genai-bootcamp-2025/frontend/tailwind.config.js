/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
      "./public/index.html"
    ],
    theme: {
      extend: {
        colors: {
          chalkboard: {
            DEFAULT: '#2c3e50', // Dark slate gray
            light: '#34495e',
            dark: '#1a252f',
          },
          chalk: {
            DEFAULT: '#ecf0f1', // Off-white
            blue: '#3498db',
            red: '#e74c3c',
            green: '#2ecc71',
            yellow: '#f1c40f',
          },
        },
        fontFamily: {
          chalk: ['Indie Flower', 'cursive'],
          sans: ['Poppins', 'system-ui', 'sans-serif'],
        },
        animation: {
          'chalk-write': 'chalk-write 1s ease-out forwards',
          'chalk-erase': 'chalk-erase 0.5s ease-out forwards',
        },
        keyframes: {
          'chalk-write': {
            '0%': { 'stroke-dashoffset': '100%' },
            '100%': { 'stroke-dashoffset': '0%' },
          },
          'chalk-erase': {
            '0%': { opacity: '1' },
            '100%': { opacity: '0' },
          },
        },
      },
    },
    plugins: [],
  }