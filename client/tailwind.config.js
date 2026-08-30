import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Every color below is backed by a CSS variable (see src/index.css :root / .light)
// rather than a fixed hex, so the whole app re-themes by toggling one class on
// <html> instead of needing dark:/light: variants sprinkled through every file.
// The RGB-triplet + <alpha-value> pattern keeps Tailwind's opacity modifiers
// (e.g. bg-amber-500/30) working with variables.
function withOpacity(variable) {
  return `rgb(var(${variable}) / <alpha-value>)`;
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [path.join(dirname, 'index.html'), path.join(dirname, 'src/**/*.{js,jsx}')],
  theme: {
    extend: {
      colors: {
        // "Courtroom / panel" identity — deliberately not the default shadcn purple.
        charcoal: {
          950: withOpacity('--c-950'),
          900: withOpacity('--c-900'),
          800: withOpacity('--c-800'),
          700: withOpacity('--c-700'),
          600: withOpacity('--c-600'),
        },
        amber: {
          400: withOpacity('--amber-400'),
          500: withOpacity('--amber-500'),
          600: withOpacity('--amber-600'),
        },
        panel: {
          hr: withOpacity('--panel-hr'),
          technical: withOpacity('--panel-technical'),
          skeptical: withOpacity('--panel-skeptical'),
        },
        // Re-theming Tailwind's own slate scale (rather than adding a parallel
        // custom scale) means every existing text-slate-* class in the app
        // already respects the toggle with zero component changes. The
        // numbers now mean "emphasis order" (50 = boldest) not literal
        // lightness — see index.css for why that inverts cleanly per theme.
        slate: {
          50: withOpacity('--s-50'),
          100: withOpacity('--s-100'),
          200: withOpacity('--s-200'),
          300: withOpacity('--s-300'),
          400: withOpacity('--s-400'),
          500: withOpacity('--s-500'),
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
