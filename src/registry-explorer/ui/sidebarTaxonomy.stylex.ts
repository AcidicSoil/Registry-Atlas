import * as stylex from "@stylexjs/stylex";
import { tokens } from "./tokens.stylex";

export const taxonomyGroupMarker = stylex.defineMarker();

/** Grouped catalog taxonomy layout and interactive appearance. */
export const taxonomyStyles = stylex.create({
  group: {
    minWidth: 0,
  },
  summary: {
    gridTemplateColumns: "20px minmax(0, 1fr) auto 12px",
    listStyleType: "none",
  },
  active: {
    color: tokens["--foreground"],
  },
  count: {
    fontSize: 11,
  },
  chevron: {
    width: 6,
    height: 6,
    justifySelf: "center",
    borderInlineEndColor: "currentColor",
    borderInlineEndStyle: "solid",
    borderInlineEndWidth: 1,
    borderBottomColor: "currentColor",
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    transform: {
      default: "rotate(45deg)",
      [stylex.when.ancestor("[open]", taxonomyGroupMarker)]: "rotate(225deg)",
    },
    transitionProperty: "transform",
    transitionDuration: {
      default: "150ms",
      "@media (prefers-reduced-motion: reduce)": "0ms",
    },
    transitionTimingFunction: "ease-out",
  },
  children: {
    display: "grid",
    gap: 2,
    marginBlockStart: 2,
    marginBlockEnd: 6,
    marginInlineStart: 16,
    paddingInlineStart: 8,
    borderInlineStartColor: tokens["--border"],
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: 1,
  },
  childRow: {
    minHeight: 30,
    fontSize: 12,
  },
});
