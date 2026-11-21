import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "marketplace-icon.svg", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "AppSoft Marketplace",
        short_name: "AppSoft",
        description: "Marketplace AppSoft",
        theme_color: "#ff6b35",
        background_color: "#f7f7f7",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api(?:\/|$)/],
        globPatterns: ["**/*.{js,css,html,svg,png,ico,json,woff2}"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
});
