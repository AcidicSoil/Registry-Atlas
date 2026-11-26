export const previewStyles = {
  root: "fixed z-[1005] block w-[min(440px,calc(100vw-24px))] overflow-hidden pointer-events-none rounded-[var(--atlas-radius-card)] border border-atlas-input bg-atlas-popover text-atlas-foreground max-[639px]:hidden [@media(hover:none)]:hidden",
  animate: "motion-safe:animate-atlas-preview",
  visual: "flex h-[270px] items-center justify-center overflow-hidden bg-atlas-card p-3",
  image: "block h-auto w-auto max-w-full max-h-full object-contain",
};
