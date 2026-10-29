/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        page: '#FAFAFA',
        surface: {
          DEFAULT: '#FFFFFF',
          hover: '#F5F5F5',
          muted: '#F5F5F5',
        },
        border: {
          DEFAULT: '#E5E5E5',
          subtle: '#F0F0F0',
          dark: '#0A0A0A',
        },
        primary: {
          DEFAULT: '#0A0A0A',
          hover: '#171717',
          foreground: '#FFFFFF',
        },
        status: {
          success: '#15803D',
          'success-bg': '#F0FDF4',
          warning: '#B45309',
          'warning-bg': '#FFFBEB',
          danger: '#B91C1C',
          'danger-bg': '#FEF2F2',
          neutral: '#525252',
          'neutral-bg': '#F5F5F5',
        },
        crm: {
          bg: '#FAFAFA',
          card: '#FFFFFF',
          sidebar: '#0A0A0A',
          hover: '#F5F5F5',
          active: '#262626',
          subtle: '#FAFAFA',
          border: '#E5E5E5',
          borderStrong: '#A3A3A3',
          borderDark: '#0A0A0A',
          muted: '#737373',
          secondary: '#525252',
          primary: '#0A0A0A',
        },
      },
      borderRadius: {
        card: '10px',
        DEFAULT: '8px',
        button: '8px',
        input: '8px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0, 0, 0, 0.06)',
        popover: '0 8px 24px rgba(0, 0, 0, 0.12)',
        dialog: '0 8px 24px rgba(0, 0, 0, 0.12)',
        xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
    },
  },
  plugins: [],
}
