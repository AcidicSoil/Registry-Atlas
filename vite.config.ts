import { defineConfig } from "vite";
import stylex from "@stylexjs/unplugin";

const stylexPlugin = stylex.vite({
  // Existing document-level CSS remains unlayered while components migrate.
  useCSSLayers: false,
  runtimeInjection: false,
});

// Vitest compiles StyleX with the same plugin, but does not need its dev
// middleware or long-lived CSS-update loop.
if (process.env.VITEST) delete stylexPlugin.configureServer;

export default defineConfig({
  base: "/Registry-Atlas/",
  plugins: [stylexPlugin],
});
