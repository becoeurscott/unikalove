import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#D6336C',
          soft: '#FDECF2',
          gold: '#C9A24B',
          cream: '#FAF3EC',
          ink: '#2B2B2B',
        },
      },
      borderRadius: {
        card: '1rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
