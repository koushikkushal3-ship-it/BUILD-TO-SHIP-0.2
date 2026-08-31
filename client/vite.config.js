import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import tailwindConfig from './tailwind.config.js';

// PostCSS/Tailwind wired inline (rather than relying on postcss.config.js)
// so config resolution is relative to this file, not the process's cwd —
// matters when this dev server is launched from outside the client/ folder.
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss(tailwindConfig), autoprefixer()],
    },
  },
  server: { port: 5173 },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-monaco': ['@monaco-editor/react'],
          'vendor-motion': ['framer-motion', 'lucide-react'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
});
