import type { Config } from 'tailwindcss'

export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        bg: {
          deep: '#FAF9F6',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          'card-hover': '#F5F5F5',
          inset: '#F0F0F0',
          base: '#FAF9F6',
        },
        border: {
          DEFAULT: '#232323',
          hover: '#000000',
        },
        text: {
          primary: '#232323',
          secondary: '#4A4A4A',
          dim: '#8A8694',
          muted: '#8A8694',
        },
        accent: '#FF603A',
        primary: '#FF603A',
        green: '#4ade80',
        blue: '#60a5fa',
      },
      borderRadius: {
        DEFAULT: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '0px',
      },
      boxShadow: {
        brutal: '4px 4px 0px 0px rgba(35, 35, 35, 1)',
        'brutal-sm': '2px 2px 0px 0px rgba(35, 35, 35, 1)',
        'brutal-lg': '8px 8px 0px 0px rgba(35, 35, 35, 1)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out',
        'stagger': 'fadeUp 0.5s ease-out var(--stagger-delay, 0s)',
      },
      keyframes: {
        fadeUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config