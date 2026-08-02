import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './site-ledger.jsx'],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
