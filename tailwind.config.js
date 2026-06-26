/** @type {import('tailwindcss').Config} */

function withOpacity(variable) {
  return ({ opacityValue }) =>
    opacityValue !== undefined
      ? `rgb(var(${variable}) / ${opacityValue})`
      : `rgb(var(${variable}))`;
}

module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk-inspired palette - CSS-variable-backed so it reacts to the
        // active theme-* class on <html> (see globals.css for per-theme values)
        'cyber': {
          primary: withOpacity('--cyber-primary'),
          secondary: withOpacity('--cyber-secondary'),
          accent: withOpacity('--cyber-accent'),
          dark: '#0A0A0B',
          'dark-800': '#151517',
          'dark-700': '#1E1E21',
          'dark-600': '#2A2A2E',
          glow: withOpacity('--cyber-glow'),
        },
        'foodie': {
          50: '#fff7ed',
          // ... add more orange shades
          900: '#7c2d12',
        },
        // Futuristic grays - CSS-variable-backed, same reasoning as 'cyber' above
        'space': {
          50: withOpacity('--space-50'),
          100: withOpacity('--space-100'),
          200: withOpacity('--space-200'),
          300: withOpacity('--space-300'),
          400: withOpacity('--space-400'),
          500: withOpacity('--space-500'),
          600: withOpacity('--space-600'),
          700: withOpacity('--space-700'),
          800: withOpacity('--space-800'),
          900: withOpacity('--space-900'),
        },
        // Override just the shades used as theme-following text colors
        // throughout the app chrome, leaving the rest of Tailwind's default
        // gray scale (used by deliberately-light cards/modals) untouched.
        'gray': {
          100: withOpacity('--gray-100'),
          300: withOpacity('--gray-300'),
          400: withOpacity('--gray-400'),
          500: withOpacity('--gray-500'),
        },
      },
      fontFamily: {
        'geist-sans': ['var(--font-geist-sans)'],
        'geist-mono': ['var(--font-geist-mono)'],
      },
      boxShadow: {
        'neon': '0 0 5px rgb(var(--cyber-glow)), 0 0 20px rgb(var(--cyber-glow))',
        'neon-strong': '0 0 10px rgb(var(--cyber-glow)), 0 0 40px rgb(var(--cyber-glow))',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': {
            opacity: 1,
            boxShadow: '0 0 5px rgb(var(--cyber-glow)), 0 0 20px rgb(var(--cyber-glow))',
          },
          '50%': {
            opacity: 0.7,
            boxShadow: '0 0 2px rgb(var(--cyber-glow)), 0 0 10px rgb(var(--cyber-glow))',
          },
        },
      },
    },
  },
  plugins: [],
}
