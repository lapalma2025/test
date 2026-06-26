/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Tła
        cream: {
          DEFAULT: '#FAF7F2',
          dark: '#1F1B17',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#272320',
        },
        // Brand
        sage: {
          DEFAULT: '#7C9082',
          soft: '#DCE6DD',
          dark: '#5F6B62',
        },
        evergreen: {
          DEFAULT: '#3D5147',
          dark: '#2A382F',
        },
        terracotta: {
          DEFAULT: '#C97B5A',
          soft: '#F5DDD0',
          dark: '#8B4A2E',
        },
        blush: {
          DEFAULT: '#E8B4A0',
          soft: '#F8E4D8',
        },
        mustard: {
          DEFAULT: '#D4915B',
          soft: '#F2DEC2',
        },
        // Tekst
        ink: {
          DEFAULT: '#2C3530',
          soft: '#5F6B62',
          faint: '#8F968F',
        },
        // Linie
        line: {
          DEFAULT: '#E5DFD3',
          strong: '#D8D2C5',
        },
        // Status
        success: '#6B8E5A',
        warning: '#D4915B',
        danger: '#B85450',
        info: '#6A8AA8',
      },
      fontFamily: {
        serif: ['Newsreader_500Medium'],
        'serif-regular': ['Newsreader_400Regular'],
        sans: ['Geist_400Regular'],
        'sans-medium': ['Geist_500Medium'],
        mono: ['GeistMono_400Regular'],
      },
      borderRadius: {
        card: '14px',
        hero: '20px',
        frame: '36px',
      },
    },
  },
  plugins: [],
};
