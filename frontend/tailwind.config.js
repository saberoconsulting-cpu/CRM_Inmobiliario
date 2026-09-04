/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF1F3',
          100: '#FFDCE1',
          200: '#FCB7C0',
          500: '#E30620',
          600: '#C9041C',
          700: '#A90318',
          800: '#8A0214',
          900: '#6E0110',
        },
        softred: '#FFF1F3',
        canvas: '#F6F7F9',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg,#E30620 0%,#C9041C 100%)',
      },
    },
  },
  plugins: [],
};
