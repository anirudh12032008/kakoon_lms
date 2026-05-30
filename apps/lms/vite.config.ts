import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/@xyflow")) return "flow";
          if (id.includes("node_modules/framer-motion")) return "motion";
          if (id.includes("node_modules/@sentry")) return "sentry";
          if (id.includes("node_modules/@reduxjs") || id.includes("node_modules/redux")) return "redux";
          if (id.includes("node_modules/react-router")) return "router";
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) return "vendor";
        },
      },
    },
  },
});
