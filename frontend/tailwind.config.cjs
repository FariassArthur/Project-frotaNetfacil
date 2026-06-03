/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        zenite: {
          DEFAULT: '#ff7f1e',
          light: '#ffa85a',
          dark: '#cc5d12',
          hover: '#f07210',
          bg: '#fff4e5',
        },
        danger: {
          DEFAULT: '#dc3545',
          hover: '#c82333',
        },
        success: {
          DEFAULT: '#28a745',
          hover: '#218838',
        },
        surface: {
          primary: '#ffffff',
          secondary: '#fafafa',
          tertiary: '#fff8f1',
          card: '#ffffff',
        },
        text: {
          primary: '#1a1a1a',
          secondary: '#444444',
          muted: '#888888',
        },
        border: {
          DEFAULT: '#e0d0c0',
          light: 'rgba(255, 144, 57, 0.18)',
        },
        sidebar: {
          bg: '#ffffff',
          border: '#f0e0d0',
          'btn-hover': '#fff4eb',
          'btn-active': '#ff8f35',
          'btn-active-text': '#ffffff',
        },
        header: {
          text: '#ffffff',
        },
        input: {
          bg: '#fffaf6',
          border: '#e8d4c5',
          'focus-border': '#ff9b4d',
        },
        login: {
          bg: '#f5f5f5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 12px 30px rgba(30, 30, 30, 0.06)',
        header: '0 4px 20px rgba(0, 0, 0, 0.1)',
        sidebar: '4px 0 20px rgba(0, 0, 0, 0.15)',
      },
      backgroundImage: {
        'header-gradient': 'linear-gradient(135deg, #ff7f1e 0%, #ffa22e 100%)',
      },
      borderRadius: {
        DEFAULT: '12px',
        'table': '12px',
        'btn': '6px',
        'card': '14px',
        'modal': '18px',
        'full': '999px',
      },
      fontSize: {
        'btn': '0.8rem',
        'btn-sm': '0.72rem',
        'table': '0.9rem',
        'table-sm': '0.75rem',
      },
    },
  },
  plugins: [],
};
