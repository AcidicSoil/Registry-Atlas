export const filterControlClasses = {
  trigger:
    "min-h-[34px] cursor-pointer rounded-[var(--atlas-radius-button)] border border-atlas-border bg-atlas-card px-3 text-[13px] text-atlas-foreground transition-colors duration-150 ease-out hover:border-atlas-input focus-visible:outline-atlas-focus",
  panel:
    "z-[100] w-[244px] max-w-[calc(100vw-32px)] rounded-[var(--atlas-radius-card)] border border-atlas-border bg-atlas-popover p-2 text-atlas-foreground",
  title: "block p-1.5 text-xs font-semibold text-atlas-muted-foreground",
  list: "max-h-64 overflow-y-auto py-1",
  group:
    "flex min-h-[34px] items-stretch rounded-[var(--atlas-radius-button)] border border-atlas-border bg-atlas-card focus-within:border-atlas-focus",
  input: "w-44 min-w-0 border-0 bg-transparent px-[9px] text-[13px] text-atlas-foreground",
  groupButton:
    "h-full min-h-8 cursor-pointer whitespace-nowrap rounded-e-[var(--atlas-radius-button)] border-0 border-s border-atlas-border bg-transparent px-2.5 text-[13px] text-atlas-foreground hover:bg-atlas-secondary",
  option:
    "[&:not([hidden])]:flex min-h-8 cursor-pointer items-center justify-between gap-2 rounded-[var(--atlas-radius-button)] px-2 py-1.5 text-[13px] data-[highlighted]:bg-atlas-secondary data-[highlighted]:text-atlas-foreground",
  indicator: "text-atlas-developer",
};
