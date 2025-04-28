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
        'blue-dark': '#1E3A8A',
        'blue-medium': '#2563EB',
        'blue-light': '#93C5FD',
        'gold': '#F59E0B',
        'gray-light': '#F3F4F6',
        'gray-dark': '#111827',
      },
      fontFamily: {
        'cairo': ['var(--font-cairo)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
