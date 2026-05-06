import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: "/Search-Algorithms-Visualizer/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@algo": resolve(__dirname, "../src"),
    },
  },
  worker: {
    format: "es",
  },
  build: {
    target: "esnext",
  },
});
