/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B1F4B',
          dark: '#061026',
          light: '#1B356E'
        },
        paytm: {
          blue: '#1A73E8',
          cyan: '#00B9F1',
          hover: '#009ED0'
        },
        turmeric: {
          DEFAULT: '#F5A524',
          50: '#FFF8EB',
          100: '#FEEFC8',
          500: '#F5A524',
          600: '#D9820A'
        },
        mint: {
          DEFAULT: '#12B886',
          light: '#E6FCF5',
          dark: '#0CA678'
        },
        coral: {
          DEFAULT: '#F25C54',
          light: '#FFEBEA',
          dark: '#D9433B'
        },
        paper: {
          DEFAULT: '#F6F8FC',
          card: '#FFFFFF',
          dark: '#0B132B',
          darkCard: '#1C2541'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'Noto Sans Devanagari', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'orb-breathe': 'orbBreathe 4s ease-in-out infinite',
      },
      keyframes: {
        orbBreathe: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 15px rgba(245, 165, 36, 0.4)' },
          '50%': { transform: 'scale(1.08)', boxShadow: '0 0 25px rgba(245, 165, 36, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}

