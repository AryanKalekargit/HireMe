/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0c1322',
        surface: '#0c1322',
        'surface-container-lowest': '#070e1d',
        'surface-container-low': '#141b2b',
        'surface-container': '#191f2f',
        'surface-container-high': '#232a3a',
        'surface-container-highest': '#2e3545',
        'surface-variant': '#2e3545',
        primary: '#c3c0ff',
        'primary-container': '#4f46e5',
        'on-primary': '#1d00a5',
        'on-primary-container': '#dad7ff',
        secondary: '#4edea3',
        'secondary-container': '#00a572',
        'on-secondary': '#003824',
        'secondary-fixed-dim': '#4edea3',
        'on-surface': '#dce2f7',
        'on-surface-variant': '#c7c4d8',
        outline: '#918fa1',
        'outline-variant': '#464555',
        warning: '#F59E0B',
        success: '#10B981',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
