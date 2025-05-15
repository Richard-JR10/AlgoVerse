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
      manifest: {
        name: "Algoverse",
        short_name: "Algo",
        description: "A progressive web app for Algoverse",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [
          {
            src: "/Square150x150Logo.scale-400.png",
            sizes: "600x600",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/Square150x150Logo.scale-200.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/Square150x150Logo.scale-200.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          }
        ]
      },
      workbox: {
        // Cache all necessary assets during build
        globPatterns: ["**/*.{js,css,html,png,jpg,svg,ico}"],
        // Increase cache size limit if needed
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Precache index.html explicitly
        additionalManifestEntries: [
          { url: "/index.html", revision: null }
        ],
        runtimeCaching: [
          {
            // Cache navigation requests (e.g., index.html)
            urlPattern: ({ request }) => request.destination === "document",
            handler: "CacheFirst", // Use CacheFirst to ensure offline access
            options: {
              cacheName: "html-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache static assets (JS, CSS, images)
            urlPattern: ({ request }) =>
                ["style", "script", "image"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          },
          {
            // Cache API calls (if applicable, replace with your API URL)
            urlPattern: /^https:\/\/your-api\.com\/.*/, // Update this
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60 // 1 day
              }
            }
          }
        ]
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
