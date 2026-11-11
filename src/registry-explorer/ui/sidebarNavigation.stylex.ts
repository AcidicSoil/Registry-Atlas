import * as stylex from "@stylexjs/stylex";

/** Shared catalog and registry navigation layout; the tokenized root owns spacing. */
export const sidebarNavigationStyles = stylex.create({
  root: {
    display: "grid",
    minWidth: 0,
    gap: 0,
    paddingBlockStart: 0,
    paddingInline: 0,
    paddingBlockEnd: 18,
  },
});
