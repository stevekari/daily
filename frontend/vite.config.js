import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "favicon.ico",
        "favicon.png",
        "favicon-32x32.png",
        "favicon-16x16.png",
        "apple-touch-icon.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "icons/*.png",
      ],
      manifest: {
        name: "Steve Budget Pro - Personal Finance Tracker",
        short_name: "SteveBudget",
        description:
          "Smart Personal Finance & Budget Tracker with AI Coaching, Receipt Scanner, and Analytics.",
        theme_color: "#ea580c",
        background_color: "#0f0a2e",
        display: "standalone",
        display_override: ["standalone", "window-controls-overlay", "minimal-ui"],
        orientation: "portrait-primary",
        start_url: "/",
        scope: "/",
        categories: ["finance", "productivity", "utilities"],
        icons: [
          {
            src: "/icons/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/pwa-maskable-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icons/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/favicon.png",
            sizes: "64x64",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
        shortcuts: [
          {
            name: "Add Transaction",
            short_name: "Add Tx",
            description: "Quickly record a new income or expense",
            url: "/?action=add-tx",
            icons: [{ src: "/icons/pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Scan Receipt",
            short_name: "Scan",
            description: "Scan an expense receipt with camera",
            url: "/?action=scan-receipt",
            icons: [{ src: "/icons/pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Analytics & Reports",
            short_name: "Reports",
            description: "View financial reports and spending analytics",
            url: "/?action=analytics",
            icons: [{ src: "/icons/pwa-192x192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpeg,jpg,webp,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
});
