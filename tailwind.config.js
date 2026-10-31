/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cs: {
          bg: '#101310',
          surface: '#181D19',
          card: '#1D231E',
          'card-hover': '#242C26',
          text: '#F3F5EF',
          muted: '#9AA39B',
          dim: '#626D64',
          lime: '#B7E36A',
          'lime-hover': '#C6EE7D',
          border: '#2B332D',
          'border-subtle': 'rgba(255, 255, 255, 0.05)',
          error: '#F07878',
          'error-muted': 'rgba(240, 120, 120, 0.12)',
          warning: '#E5A854',
          'warning-muted': 'rgba(229, 168, 84, 0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.35)',
        'elevated': '0 4px 12px 0 rgba(0, 0, 0, 0.45)',
        'modal': '0 16px 36px 0 rgba(0, 0, 0, 0.65)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(6px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
