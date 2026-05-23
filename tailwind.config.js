/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          550: '#16a34a', // Municipal Emerald
          600: '#16a34a',
          700: '#15803d', // Municipal Dark Green
          800: '#166534', // Forest Green
          900: '#14532d', // Deep Forest Green
          950: '#052e16',
        }
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'modal-backdrop': 'modalBackdropIn 0.2s ease-out forwards',
        'modal-dialog': 'modalDialogIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        modalBackdropIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        modalDialogIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      }
    },
  },
  plugins: [],
}
