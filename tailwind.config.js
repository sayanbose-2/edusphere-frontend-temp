/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Secondary palette (neutral)
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Semantic colors
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        info: '#0284C7',
        // Custom variants
        'bg-subtle': '#F8FAFC',
        'text-muted': '#64748B',
        'text-dimmed': '#94A3B8',
        'border-light': '#E2E8F0',
      },
      backgroundColor: {
        surface: 'var(--surface)',
        base: 'var(--bg)',
        subtle: 'var(--subtle)',
        'blue-dim': 'var(--blue-dim)',
        'bg-2': 'var(--bg)',
      },
      textColor: {
        base: 'var(--text)',
        secondary: 'var(--text-2)',
        tertiary: 'var(--text-3)',
        danger: 'var(--danger)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        info: 'var(--info)',
        blue: 'var(--blue)',
      },
      borderColor: {
        light: 'var(--border)',
        border: 'var(--border)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['10px', { lineHeight: '1.4' }],
        sm: ['12px', { lineHeight: '1.4' }],
        base: ['14px', { lineHeight: '1.55' }],
        lg: ['16px', { lineHeight: '1.6' }],
        xl: ['18px', { lineHeight: '1.7' }],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(15,23,42,0.06), 0 3px 10px rgba(15,23,42,0.04)',
        DEFAULT: '0 1px 2px rgba(15,23,42,0.06), 0 3px 10px rgba(15,23,42,0.04)',
        lg: '0 6px 28px rgba(15,23,42,0.09), 0 2px 6px rgba(15,23,42,0.05)',
        xl: '0 10px 40px rgba(15,23,42,0.12)',
        'var-sm': 'var(--shadow)',
        'var-lg': 'var(--shadow-lg)',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        lg: '10px',
        xl: '12px',
      },
      spacing: {
        0.5: '2px',
        1.5: '6px',
        2.5: '10px',
        3.5: '14px',
        4.5: '18px',
        5: '20px',
        5.5: '22px',
        6: '24px',
        6.5: '26px',
        7: '28px',
        7.5: '30px',
        8: '32px',
        8.5: '34px',
        9: '36px',
        9.5: '38px',
        10: '40px',
        10.5: '42px',
        11: '44px',
        12: '48px',
        13: '52px',
        14: '56px',
        15: '60px',
        16: '64px',
        20: '80px',
      },
      opacity: {
        8: '0.08',
        10: '0.1',
      },
      width: {
        34: '34px',
        40: '40px',
      },
      height: {
        34: '34px',
        40: '40px',
      },
      lineHeight: {
        1.6: '1.6',
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideIn: 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      transitionDuration: {
        200: '200ms',
      },
    },
  },
  darkMode: ['class', '[data-theme="dark"]'],
  plugins: [
    function ({ addBase, addComponents, theme }) {
      // Dark mode overrides
      addBase({
        '[data-theme="dark"]': {
          '--surface': '#161B22',
          '--bg': '#0D1117',
          '--subtle': '#1C2128',
          '--border': '#30363D',
          '--text': '#E6EDF3',
          '--text-2': '#8B949E',
          '--text-3': '#484F58',
          '--blue': '#58A6FF',
          '--blue-dim': 'rgba(88, 166, 255, 0.1)',
          '--shadow': '0 1px 2px rgba(0,0,0,0.3), 0 3px 10px rgba(0,0,0,0.2)',
          '--shadow-lg': '0 6px 28px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.3)',
        },
      });

      // Utility component for commonly used patterns
      addComponents({
        '.icon-btn': {
          '@apply flex items-center justify-center w-8 h-8 rounded hover:bg-secondary-100 cursor-pointer transition-colors duration-200': {},
          '&[data-theme="dark"]': {
            '@apply hover:bg-secondary-700': {},
          },
        },
        '.skeleton': {
          '@apply animate-pulse bg-secondary-200 rounded': {},
          '&[data-theme="dark"]': {
            '@apply bg-secondary-700': {},
          },
        },
        '.btn-primary': {
          '@apply px-3 py-2 bg-primary-600 text-white rounded font-medium text-sm hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed': {},
        },
        '.btn-secondary': {
          '@apply px-3 py-2 bg-secondary-200 text-secondary-900 rounded font-medium text-sm hover:bg-secondary-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed': {},
          '&[data-theme="dark"]': {
            '@apply bg-secondary-700 text-secondary-50 hover:bg-secondary-600': {},
          },
        },
        '.btn-danger': {
          '@apply px-3 py-2 bg-danger text-white rounded font-medium text-sm hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed': {},
        },
        '.card': {
          '@apply bg-surface border border-light rounded-lg shadow-sm': {},
        },
      });
    },
  ],
}
