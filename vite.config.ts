import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves from a subpath (repo name). Override with VITE_BASE if needed.

export default defineConfig({
  base: '/chess-cheatter/',
  plugins: [react()],
  // Stockfish ships its own .wasm; keep it out of dependency optimization.
  optimizeDeps: {
    exclude: ["stockfish"],
  },
  worker: {
    format: "es",
  },
});
