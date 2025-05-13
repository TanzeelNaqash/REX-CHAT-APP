import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Add this single alias for simple-peer
      "simple-peer": "simple-peer/simplepeer.min.js"
    },
  },
  define: {
    global: "window",
  },
  optimizeDeps: {
    // Explicitly include simple-peer
    include: ["simple-peer"]
  },
  build: {
    commonjsOptions: {
      // Ensure simple-peer is properly transformed
      include: [/simple-peer/]
    }
  }
});