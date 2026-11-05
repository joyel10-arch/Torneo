/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Design System Tokens — Torneo Sports Dark Editorial
        midnight: '#16051F',        // Primary background
        'midnight-light': '#1E0B2C', // Slightly lighter bg variant
        muted: '#30203B',           // Cards, panels, navigation
        'muted-dark': '#261831',    // Deeper surface
        'muted-border': '#493650',  // Borders
        teal: {
          deep: '#073B3A',          // Deep Teal
          electric: '#21E6D1',      // Electric Teal (sparingly)
        },
        magenta: {
          neon: '#F500A8',          // Neon Magenta — primary CTA
          soft: '#C40087',          // Darker magenta for hover
        },
        lavender: '#F4EFF7',
        text: {
          primary: '#F8F5FA',
          secondary: '#B9AFC2',
        },
        status: {
          success: '#21C58E',
          warning: '#F5B942',
          error: '#FF647C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.625rem',
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'elevated': '0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)',
        'glow-magenta': '0 0 16px rgba(245, 0, 168, 0.35)',
        'glow-teal': '0 0 16px rgba(33, 230, 209, 0.25)',
      },
      backgroundImage: {
        'gradient-midnight': 'linear-gradient(135deg, #16051F 0%, #073B3A 100%)',
        'gradient-card': 'linear-gradient(135deg, #1E0B2C 0%, #261831 100%)',
        'gradient-accent': 'linear-gradient(135deg, #F500A8 0%, #21E6D1 100%)',
        'gradient-subtle': 'linear-gradient(180deg, #16051F 0%, #0d0417 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        sidebar: '16rem',
        'sidebar-collapsed': '4rem',
      },
      transitionDuration: {
        DEFAULT: '150ms',
        fast: '100ms',
        normal: '200ms',
        slow: '300ms',
      },
    },
  },
  plugins: [],
}
