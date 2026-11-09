import * as stylex from "@stylexjs/stylex";

// Canonical semantic tokens. Named CSS variables keep existing global
// document styles functional until their owning components migrate.
export const tokens = stylex.defineVars({
  "--background": "#0b0c0e",
  "--foreground": "#edeef0",
  "--card": "#121316",
  "--preview-visual": "#131519",
  "--popover": "#16181c",
  "--secondary": "#1a1c20",
  "--muted-foreground": "#8a8f98",
  "--border": "rgb(255 255 255 / 35%)",
  "--input": "rgb(255 255 255 / 40%)",
  "--scrollbar": "var(--input) transparent",
  "--discovery-snap-mode": "x proximity",
  "--primary": "#4ea1ff",
  "--radius-button": "11px",
  "--radius-card": "14px",
  "--space-1": "4px",
  "--space-2": "8px",
  "--space-3": "12px",
  "--space-4": "16px",
  "--space-5": "20px",
  "--space-6": "24px",
  "--font-sans":
    'inter, ui-sans-serif, system-ui, -apple-system, blinkmacsystemfont, "Segoe UI", sans-serif',
  "--font-mono":
    'ui-monospace, sfmono-regular, menlo, monaco, consolas, "Liberation Mono", monospace',
});
