import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
    VitePWA(
        {
          manifest: {
            icons: [
              {
                "src": "public/Square150x150Logo.scale-400.png",
                "sizes": "600x600",
                type: "image/png",
                purpose: "any maskable",
              },
            ]
          }
        }
    ),
  ],
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
