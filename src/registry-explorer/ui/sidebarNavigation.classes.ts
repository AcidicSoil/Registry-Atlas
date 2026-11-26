export const sidebarNavigationStyles = {
  root: "grid min-w-0 gap-0 px-0 pt-0 pb-[18px]",
  section: "grid min-w-0 gap-0",
  sectionLabel:
    "flex min-h-9 items-end m-0 px-2 pt-0 pb-1.5 text-xs font-semibold tracking-[0.08em] uppercase leading-none text-atlas-muted-foreground",
  row: "grid w-full min-w-0 min-h-8 items-center gap-1 m-0 px-2 py-0 border-0 rounded-[var(--atlas-radius-button)] bg-transparent text-sm leading-[1.2] text-left no-underline text-atlas-muted-foreground cursor-pointer hover:bg-atlas-secondary hover:text-atlas-foreground focus-visible:outline-2 focus-visible:outline-atlas-focus focus-visible:outline-offset-[-2px]",
  rowWithIcon: "grid-cols-[20px_minmax(0,1fr)_auto]",
  rowWithoutIcon: "grid-cols-[minmax(0,1fr)_auto]",
  rowActive: "bg-atlas-secondary text-atlas-foreground",
  label: "min-w-0 truncate",
  count: "min-w-5 text-xs tabular-nums text-right text-atlas-muted-foreground",
  icon: "grid size-4 place-items-center text-current",
  iconSvg:
    "size-4 overflow-visible fill-none stroke-current stroke-[1.15] [stroke-linecap:round] [stroke-linejoin:round]",
};
