export const directoryStyles = {
  grid: "grid gap-3",
  gridColumns: "grid-cols-3 max-[1080px]:grid-cols-2 max-[700px]:grid-cols-1",
  gridList: "grid-cols-1",
  card: "flex min-w-0 min-h-[158px] flex-col gap-0 p-0 border rounded-[var(--atlas-radius-card)] border-atlas-border bg-atlas-card overflow-hidden",
  cardList:
    "grid min-h-24 grid-cols-[minmax(0,1fr)_auto] max-[700px]:grid-cols-1 grid-rows-[minmax(0,1fr)_auto] items-stretch",
  open: "group/directory grid min-w-0 flex-auto content-start gap-3 px-4 pt-4 pb-2.5 text-inherit no-underline focus-visible:outline-2 focus-visible:outline-atlas-focus focus-visible:outline-offset-[3px] focus-visible:rounded-[var(--atlas-radius-button)]",
  openList:
    "grid-cols-[minmax(210px,0.45fr)_minmax(0,1fr)] max-[700px]:grid-cols-1 items-center pb-4",
  description: "line-clamp-2 min-w-0 m-0 text-[13px] leading-[1.45] text-atlas-muted-foreground",
  heading: "flex min-w-0 flex-row items-start justify-between gap-3 max-[640px]:flex-col",
  identity: "flex min-w-0 items-center gap-2.5",
  identityCopy: "min-w-0",
  headingTitle:
    "m-0 [overflow-wrap:anywhere] text-sm leading-[1.3] group-hover/directory:text-atlas-primary",
  itemCount: "block mt-0.5 text-xs text-atlas-muted-foreground",
  meta: "flex min-w-0 flex-wrap items-center justify-between gap-3 px-4 pt-0 pb-3.5 text-[11px] text-atlas-muted-foreground",
  metaList:
    "min-w-[150px] self-center p-4 border-l border-t-0 border-atlas-border max-[700px]:min-w-0 max-[700px]:border-l-0 max-[700px]:border-t",
  status: "truncate",
  homepage:
    "flex-none text-atlas-muted-foreground no-underline hover:text-atlas-primary hover:underline",
};
