/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FAF8F3',
          100: '#F7F4EC', // Main background
          200: '#EFE9DC',
          300: '#E5DCB',
          400: '#D7CBBA',
          500: '#C2B39E',
        },
        forest: {
          50: '#F2F7F4',
          100: '#E3ECE7',
          200: '#C7D9CF',
          300: '#9DBBB0',
          400: '#6D998B',
          500: '#477B6D',
          600: '#326054',
          700: '#234C42',
          800: '#173F35', // Primary brand color
          900: '#0E2822',
          950: '#071814',
        },
        sage: {
          50: '#F7FAF7',
          100: '#EDF4EE',
          200: '#DCE8DE', // Secondary accent
          300: '#C5D7C8',
          400: '#A4BFAB',
          500: '#81A38A',
          600: '#64856E',
          700: '#4D6855',
        },
        charcoal: {
          50: '#F6F7F7',
          100: '#EBECEB',
          200: '#D7D9D8',
          300: '#B8BCBA',
          400: '#949996',
          500: '#737A76',
          600: '#585F5B',
          700: '#424845',
          800: '#252B28', // Primary text
          900: '#191C1B',
          950: '#0F1110',
        },
        terracotta: {
          50: '#FDF6F4',
          100: '#FCEBE7',
          200: '#F9D4CD',
          300: '#F4B2A5',
          400: '#E97F6C',
          500: '#D95841',
          600: '#BF3D27',
          700: '#9E2E1B',
          800: '#832717',
        },
        sand: {
          100: '#ECE6D8',
          200: '#E2DAC8',
          300: '#D4CAB4',
          400: '#B8AB92',
        }
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(23, 63, 53, 0.05)',
        'card': '0 1px 3px 0 rgba(23, 63, 53, 0.06), 0 1px 2px -1px rgba(23, 63, 53, 0.06)',
        'elevated': '0 4px 6px -1px rgba(23, 63, 53, 0.07), 0 2px 4px -2px rgba(23, 63, 53, 0.05)',
        'modal': '0 10px 25px -5px rgba(23, 63, 53, 0.12), 0 8px 10px -6px rgba(23, 63, 53, 0.08)',
      },
      borderColor: {
        DEFAULT: '#E5DFD0',
      }
    },
  },
  plugins: [],
}
