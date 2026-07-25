import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves from a subpath (repo name). Override with VITE_BASE if needed.
const base = process.env.VITE_BASE ?? "./";

export default defineConfig({
  base,
  plugins: [react()],
  // Stockfish ships its own .wasm; keep it out of dependency optimization.
  optimizeDeps: {
    exclude: ["stockfish"],
  },
  worker: {
    format: "es",
  },
});
