import type { Config } from 'tailwindcss';
import daisyui from 'daisyui';
import forms from '@tailwindcss/forms';

export default {
  content: ['./src/**/*.{html,md,svelte,svx,ts}'],
  theme: {},
  daisyui: {
    // light: autumn, cupcake, emerald, garden
    // dark: coffee, forest, luxury
    themes: [
      'autumn',
      'cupcake',
      'emerald',
      'garden',
      'coffee',
      'forest',
      'luxury',
      'light',
      'pastel',
      'winter',
    ],
    darkTheme: 'forest',
  },
  plugins: [forms, daisyui],
} satisfies Config;
