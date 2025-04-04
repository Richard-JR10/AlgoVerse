import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss()],
  server: {
    middleware: [
      (req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');  // Add this!
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // Still often needed
        next();
      },
    ],
  },
})
