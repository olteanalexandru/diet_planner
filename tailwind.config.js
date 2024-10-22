/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk-inspired palette
        'cyber': {
          primary: '#0FF4C6',
          secondary: '#7B2CBF',
          accent: '#FF124F',
          dark: '#0A0A0B',
          'dark-800': '#151517',
          'dark-700': '#1E1E21',
          'dark-600': '#2A2A2E',
          glow: '#00F5D4',
        },
        // Futuristic grays
        'space': {
          50: '#EAEAEA',
          100: '#BEBEBF',
          200: '#929293',
          300: '#666667',
          400: '#3D3D3E',
          500: '#242425',
          600: '#1A1A1B',
          700: '#131314',
          800: '#0D0D0E',
          900: '#060607',
        }
      },
      fontFamily: {
        'geist-sans': ['var(--font-geist-sans)'],
        'geist-mono': ['var(--font-geist-mono)'],
      },
      boxShadow: {
        'neon': '0 0 5px theme(colors.cyber.glow), 0 0 20px theme(colors.cyber.glow)',
        'neon-strong': '0 0 10px theme(colors.cyber.glow), 0 0 40px theme(colors.cyber.glow)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': {
            opacity: 1,
            boxShadow: '0 0 5px theme(colors.cyber.glow), 0 0 20px theme(colors.cyber.glow)',
          },
          '50%': {
            opacity: 0.7,
            boxShadow: '0 0 2px theme(colors.cyber.glow), 0 0 10px theme(colors.cyber.glow)',
          },
        },
      },
    },
  },
  plugins: [],
}

