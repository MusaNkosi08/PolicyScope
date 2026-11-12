import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, /api requests are proxied to the local Express server (server/index.ts).
// On Vercel, /api/analyze is served by the serverless function in api/analyze.ts.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.API_PORT ?? 8787}`,
        changeOrigin: true,
      },
    },
  },
});
