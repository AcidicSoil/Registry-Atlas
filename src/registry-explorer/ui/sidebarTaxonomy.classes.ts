export const taxonomyStyles = {
  group: "group/taxonomy min-w-0",
  summary: "grid-cols-[20px_minmax(0,1fr)_auto_12px] list-none",
  active: "text-atlas-foreground",
  count: "text-[11px]",
  chevron:
    "size-1.5 justify-self-center border-e border-b border-current [transform:rotate(45deg)] group-open/taxonomy:[transform:rotate(225deg)] transition-transform duration-150 ease-out motion-reduce:duration-0",
  children: "grid gap-0.5 mt-0.5 mb-1.5 ms-4 ps-2 border-s border-atlas-border",
  childRow: "min-h-[30px] text-xs",
};
