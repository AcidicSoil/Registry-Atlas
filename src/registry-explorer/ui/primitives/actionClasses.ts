import { cn } from "./cn";

const base =
  "cursor-pointer rounded-[var(--atlas-radius-button)] border border-atlas-border px-3 py-2 leading-[1.25] no-underline transition-colors duration-150 ease-out";

const disabled =
  "disabled:cursor-not-allowed disabled:border-dashed disabled:bg-transparent disabled:text-atlas-muted-foreground disabled:grayscale disabled:opacity-[0.62] disabled:line-through";

export const actionClasses = {
  link: cn(
    base,
    "inline-flex w-fit items-center bg-transparent text-[13px] text-atlas-primary hover:border-atlas-primary/55 hover:text-atlas-foreground",
  ),
  install: cn(
    base,
    disabled,
    "bg-transparent text-xs text-atlas-foreground enabled:hover:border-atlas-input enabled:hover:bg-atlas-secondary",
  ),
  primary: cn(
    base,
    disabled,
    "border-atlas-primary bg-atlas-primary text-xs font-[650] text-atlas-background enabled:hover:border-atlas-focus enabled:hover:bg-atlas-focus",
  ),
};
