import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#070A14',
          surface: '#0E1322',
          elevated: '#171E33',
        },
        accent: {
          DEFAULT: '#7C9CE4',
          deep: '#4661B0',
          soft: '#2C3A63',
        },
        text: {
          primary: '#EEF1F8',
          secondary: '#929BB2',
          muted: '#565E75',
        },
        border: {
          subtle: 'rgba(124,156,228,0.15)',
          medium: 'rgba(124,156,228,0.30)',
          strong: 'rgba(124,156,228,0.55)',
        },
        status: {
          success: '#6E8FA8',
          error: '#8B4040',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Cormorant', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Tenor Sans"', 'serif'],
      },
      fontSize: {
        'xs':   ['11px', { lineHeight: '14px' }],
        'sm':   ['13px', { lineHeight: '18px' }],
        'base': ['15px', { lineHeight: '22px' }],
        'md':   ['17px', { lineHeight: '24px' }],
        'lg':   ['20px', { lineHeight: '28px' }],
        'xl':   ['26px', { lineHeight: '32px' }],
        '2xl':  ['34px', { lineHeight: '40px' }],
        '3xl':  ['46px', { lineHeight: '50px' }],
        '4xl':  ['64px', { lineHeight: '64px' }],
        '5xl':  ['88px', { lineHeight: '88px' }],
      },
      letterSpacing: {
        tighter: '-0.01em',
        wide:    '0.04em',
        wider:   '0.12em',
        widest:  '0.22em',
      },
      borderRadius: {
        sm:   '6px',
        md:   '12px',
        lg:   '18px',
        xl:   '28px',
        pill: '999px',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'pulse-accent': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-up':    'fade-up 300ms cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in':    'fade-in 300ms cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-accent': 'pulse-accent 2s ease-in-out infinite',
        'spin-slow':  'spin-slow 3s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
