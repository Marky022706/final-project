/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
      fontSize: {
        // Standard Web Font Hierarchy
        'h1': ['2.25rem', { lineHeight: '2.75rem', fontWeight: '800' }],      // 36px (2rem – 2.5rem)
        'h2': ['1.75rem', { lineHeight: '2.25rem', fontWeight: '700' }],      // 28px (1.5rem – 2rem)
        'h3': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],      // 20px (1.125rem – 1.375rem)
        'body': ['1rem', { lineHeight: '1.625rem', fontWeight: '400' }],       // 16px (1rem – 1.125rem)
        'body-lg': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '400' }], // 18px
        'caption': ['0.8125rem', { lineHeight: '1.25rem' }],                   // 13px (0.75rem – 0.875rem)
        'btn': ['0.9375rem', { lineHeight: '1.375rem', fontWeight: '600' }],   // 15px (0.875rem – 1rem)
      },
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          550: '#16a34a',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
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
