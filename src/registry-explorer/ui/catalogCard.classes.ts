export const cardStyles = {
  card: "group/card relative flex min-w-0 min-h-[150px] flex-col overflow-hidden rounded-[var(--atlas-radius-card)] border border-atlas-border bg-atlas-card p-0 shadow-none transition-colors duration-150 ease-out hover:border-atlas-input",
  collectionCard: "rounded-none border-t-0 border-l-0",
  listCard: "min-h-[104px] rounded-none border-x-0 border-t-0 border-b",
  discoveryCard: "h-auto snap-start",
  open: "grid w-full min-w-0 min-h-0 flex-auto flex-col content-start gap-3 border-0 bg-transparent px-3.5 pt-3.5 pb-2 text-left text-inherit no-underline cursor-pointer group-hover/card:text-atlas-foreground focus-visible:outline-2 focus-visible:outline-atlas-focus focus-visible:outline-offset-[-3px]",
  listOpen: "min-h-[72px] grid-cols-[minmax(220px,0.36fr)_minmax(0,1fr)] items-center gap-[18px]",
  copy: "grid min-w-0 min-h-0 content-start gap-0.5 p-0",
  name: "min-w-0 truncate [overflow-wrap:anywhere] text-sm font-semibold leading-[1.3] text-atlas-foreground max-[520px]:text-[15px]",
  registry: "font-atlas-mono text-xs text-atlas-developer",
  description:
    "line-clamp-2 min-w-0 min-h-[38px] m-0 text-[13px] leading-[1.45] text-atlas-muted-foreground",
  listDescription: "min-h-0",
  kind: "flex-none text-[11px] leading-[1.3] text-atlas-muted-foreground",
  heading: "flex min-w-0 items-start justify-between gap-2.5",
  library: "flex min-w-0 items-center gap-2.5",
  actions: "mt-auto flex min-w-0 flex-wrap items-center gap-3 px-3.5 pt-0 pb-[13px]",
  copyName:
    "inline-flex min-w-8 min-h-8 shrink-0 items-center justify-center rounded-[var(--atlas-radius-button)] border-0 bg-transparent p-0 text-atlas-muted-foreground cursor-pointer hover:bg-atlas-secondary hover:text-atlas-foreground focus-visible:text-atlas-foreground focus-visible:outline-2 focus-visible:outline-atlas-focus focus-visible:outline-offset-2 pointer-coarse:min-w-11 pointer-coarse:min-h-11",
  original:
    "static inline-flex min-w-6 min-h-6 self-start items-center m-0 p-0 text-[11px] text-atlas-muted-foreground no-underline underline-offset-[3px] hover:text-atlas-primary hover:underline pointer-coarse:min-w-11 pointer-coarse:min-h-11",
  metadata:
    "grid w-full h-auto min-h-[104px] content-end gap-3 p-4 bg-linear-to-b from-white/[0.012] to-white/[0.035]",
  metadataText: "m-0 text-[13px] leading-[1.45] text-atlas-foreground",
  metadataFacts: "flex flex-wrap gap-2 text-[10px] text-atlas-muted-foreground",
  registryHomepage:
    "inline-flex min-h-6 items-center text-[11px] leading-[1.3] text-atlas-primary underline underline-offset-2 hover:text-atlas-foreground focus-visible:text-atlas-foreground focus-visible:outline-2 focus-visible:outline-atlas-focus focus-visible:outline-offset-2 pointer-coarse:min-h-11",
};
