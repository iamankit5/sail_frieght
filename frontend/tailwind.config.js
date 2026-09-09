/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        marine: {
          950: '#04070e',
          900: '#070c17',
          850: '#0a1220',
          800: '#0f1a2e',
          700: '#162640',
          600: '#1f3659',
          500: '#2b4c7d',
        },
        ocean: {
          500: '#0284c7',
          400: '#38bdf8',
          300: '#7dd3fc',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
