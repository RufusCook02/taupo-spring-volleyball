import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // "Lakefront" – navy tuned towards the TVC logo blue, plus white.
        navy: { DEFAULT: '#0B2559', deep: '#071A40', 700: '#16357A' },
        mist: '#EEF2F8', // page background / soft fills
        rule: '#D8E0EC', // borders
        ink: { muted: '#5D6E88' },
        live: '#E0263B',
      },
      fontFamily: {
        sans: ['var(--font-barlow)', 'system-ui', 'sans-serif'],
        cond: ['var(--font-barlow-cond)', '"Arial Narrow"', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
