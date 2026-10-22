import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const clientPort = Number(process.env.VITE_PORT) || 5173;
const apiPort = Number(process.env.VIEWER_PORT) || 3001;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: clientPort,
    proxy: {
      "/published": {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
      "/api": {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
});
