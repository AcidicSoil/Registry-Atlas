import { cn } from "./cn";

const base =
  "cursor-pointer rounded-[var(--atlas-radius-button)] border border-atlas-border px-3 py-2 leading-[1.25] no-underline transition-colors duration-150 ease-out";

const disabled =
  "disabled:cursor-not-allowed disabled:border-dashed disabled:bg-transparent disabled:text-atlas-muted-foreground disabled:grayscale disabled:opacity-[0.62] disabled:line-through";

export const actionClasses = {
  link: cn(
    base,
    "inline-flex w-fit items-center gap-1.5 bg-transparent text-sm text-atlas-primary hover:border-atlas-primary/55 hover:text-atlas-foreground",
  ),
  install: cn(
    base,
    disabled,
    "bg-transparent text-xs text-atlas-foreground enabled:hover:border-atlas-input enabled:hover:bg-atlas-secondary",
  ),
  primary: cn(
    base,
    disabled,
    "inline-flex items-center gap-1.5 border-atlas-input bg-transparent text-xs font-semibold text-white enabled:hover:border-white enabled:hover:bg-atlas-secondary",
  ),
};
