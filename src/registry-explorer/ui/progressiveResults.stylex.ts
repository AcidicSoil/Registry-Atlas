import * as stylex from "@stylexjs/stylex";
import { tokens } from "./tokens.stylex";

export const progressiveStyles = stylex.create({
  loader: {
    display: "grid",
    minHeight: 72,
    placeItems: "center",
    gap: 6,
    paddingBlockStart: 16,
    paddingInline: 0,
    paddingBlockEnd: 28,
  },
  loadMore: {
    paddingBlock: 10,
    paddingInline: 18,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-button"],
    backgroundColor: tokens["--card"],
    color: tokens["--foreground"],
    cursor: "pointer",
    outlineColor: { default: null, ":focus-visible": tokens["--primary"] },
    outlineStyle: { default: null, ":focus-visible": "solid" },
    outlineWidth: { default: null, ":focus-visible": 2 },
    outlineOffset: { default: null, ":focus-visible": 3 },
  },
  sentinel: {
    width: "100%",
    height: 1,
  },
});
