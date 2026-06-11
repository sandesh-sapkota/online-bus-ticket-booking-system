/** @type {import('tailwindcss').Config} */
const withVar = (v) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // --- Semantic, theme-aware tokens (driven by CSS variables) ---
        canvas: withVar('--canvas'),
        surface: withVar('--surface'),
        surface2: withVar('--surface-2'),
        line: withVar('--line'),
        line2: withVar('--line-2'),
        fg: withVar('--text-base'),
        muted: withVar('--text-muted'),
        faint: withVar('--text-faint'),
        accent: {
          DEFAULT: withVar('--accent'),
          hover: withVar('--accent-hover'),
          fg: withVar('--accent-fg'),
          soft: withVar('--accent-soft'),
          softfg: withVar('--accent-soft-fg'),
        },
        success: {
          DEFAULT: withVar('--success'),
          soft: withVar('--success-soft'),
          softfg: withVar('--success-soft-fg'),
        },
        danger: {
          DEFAULT: withVar('--danger'),
          soft: withVar('--danger-soft'),
          softfg: withVar('--danger-soft-fg'),
        },
        // --- Static teal brand scale (for hero gradient / fixed shades) ---
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 4px 24px -8px rgba(2, 6, 23, 0.12)',
        card: '0 1px 2px rgba(2, 6, 23, 0.06), 0 10px 30px -16px rgba(2, 6, 23, 0.20)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s ease-out both',
      },
    },
  },
  plugins: [],
}
