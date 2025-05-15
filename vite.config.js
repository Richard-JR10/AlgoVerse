import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true // Enable service worker in dev mode
      },
      srcDir: 'src',
      filename: 'sw.js',
      strategies: 'generateSW',
      manifest: {
        name: "Algoverse",
        short_name: "Algoverse",
        description: "A progressive web app for Algoverse",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [
          {
            src: "/512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          }
        ]
      },
      workbox: {
        // Cache critical assets
        globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg,gif,ico}', '512.png'],
        runtimeCaching: [
          {
            // Handle navigation requests (e.g., page reloads)
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'CacheFirst',
            options: {
              cacheName: 'html-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            // Cache static assets including SVG and GIF
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|woff2)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'asset-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            // Cache Node.js backend API responses
            urlPattern: ({ url }) => url.origin === 'https://algoverse-backend-nodejs.onrender.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-nodejs-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache Python backend API responses
            urlPattern: ({ url }) => url.origin === 'https://algoverse-backend-python.onrender.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-python-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      }
    }),
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
