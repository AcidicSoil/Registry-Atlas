import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/Registry-Atlas/",
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      output: { manualChunks: { validation: ["zod"] } },
    },
  },
});
