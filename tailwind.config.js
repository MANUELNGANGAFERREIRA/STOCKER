/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cores da marca ContaFácil AO
        primary: {
          DEFAULT: '#1E40AF',
          50: '#EFF4FF',
          100: '#DBE6FE',
          600: '#1E40AF',
          700: '#1A3690',
          900: '#122662',
        },
        secondary: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          100: '#FEF3C7',
          600: '#F59E0B',
          700: '#D97706',
        },
        bgapp: '#F3F4F6',
        risco: '#DC2626',
        semstock: '#7C2D12',
        ok: '#16A34A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',
      },
    },
  },
  plugins: [],
};
