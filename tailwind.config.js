/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        marfil: '#F7F3EE',
        arena: '#E8DDD1',
        nude: '#C7AD97',
        taupe: '#9B8170',
        ingles: {
          DEFAULT: '#1F4638',
          dark: '#163428',
          light: '#2C5E4C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
