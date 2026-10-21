import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const buildTime = new Date().toISOString();
  return {
    define: {
      "import.meta.env.VITE_BUILD_TIME": JSON.stringify(buildTime),
    },
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      VitePWA({
        disable: true,
        registerType: "autoUpdate",
        includeAssets: ["favicon.png", "pwa-icons/icon-192x192.png", "pwa-icons/icon-512x512.png"],
        workbox: {
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          navigateFallbackDenylist: [/^\/~oauth/],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
        manifest: {
          name: "Feed_BPF by CLXN",
          short_name: "Feed_BPF",
          description: "Sistema de Gestão de Boas Práticas de Fabricação para Fábricas de Ração",
          theme_color: "#1a1a2e",
          background_color: "#1a1a2e",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          icons: [
            {
              src: "/pwa-icons/icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/pwa-icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/pwa-icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1000,
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-ui": [
              "@radix-ui/react-accordion",
              "@radix-ui/react-alert-dialog",
              "@radix-ui/react-avatar",
              "@radix-ui/react-checkbox",
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-label",
              "@radix-ui/react-popover",
              "@radix-ui/react-select",
              "@radix-ui/react-separator",
              "@radix-ui/react-slot",
              "@radix-ui/react-switch",
              "@radix-ui/react-tabs",
              "@radix-ui/react-toast",
              "@radix-ui/react-tooltip"
            ],
            "vendor-charts": ["recharts"],
            "vendor-utils": ["lucide-react", "date-fns", "clsx", "tailwind-merge"],
            "vendor-docs": ["xlsx", "docx", "file-saver"],
            "vendor-query": ["@tanstack/react-query"],
            "vendor-supabase": ["@supabase/supabase-js"]
          }
        }
      }
    }
  };
});