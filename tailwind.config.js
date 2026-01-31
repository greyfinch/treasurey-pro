/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional treasury theme
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Sky blue core
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        money: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981', // Green for positive numbers
          600: '#059669',
          700: '#047857',
        },
        expense: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444', // Red for withdrawals/negative
          600: '#dc2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
