/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#1B4332',
          50: '#f0faf4',
          100: '#dcf5e7',
          200: '#bbead0',
          300: '#86d6ad',
          400: '#52b788',
          500: '#2d9163',
          600: '#1e7450',
          700: '#1B4332',
          800: '#163827',
          900: '#0f2a1d',
        },
        lime: {
          DEFAULT: '#52B788',
          accent: '#74C69D',
        },
        cream: '#F8F6F0',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        btn: '14px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.12)',
      },
      minHeight: {
        touch: '44px',
        btn: '52px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'scale-in': 'scaleIn 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'skeleton': 'skeleton 1.4s ease-in-out infinite',
        'drop': 'drop 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { transform: 'translateY(100%)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        slideInRight: { from: { transform: 'translateX(100%)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: 0 },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        scaleIn: { from: { transform: 'scale(0.95)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
        pulseSoft: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
        skeleton: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
        drop: {
          '0%': { transform: 'translateY(-20px)', opacity: 0 },
          '60%': { transform: 'translateY(4px)' },
          '80%': { transform: 'translateY(-2px)' },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
