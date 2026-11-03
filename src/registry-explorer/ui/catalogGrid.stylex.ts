import * as stylex from "@stylexjs/stylex";
import { tokens } from "./tokens.stylex";

export const gridStyles = stylex.create({
  grid: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(3, minmax(0, 1fr))",
      "@media (width <= 1080px)": "repeat(2, minmax(0, 1fr))",
      "@media (width <= 700px)": "minmax(0, 1fr)",
    },
    rowGap: {
      default: 12,
      "@media (width <= 520px)": 21,
    },
    columnGap: {
      default: 12,
      "@media (width <= 520px)": 21,
    },
  },
  list: {
    gridTemplateColumns: "minmax(0, 1fr)",
    rowGap: 0,
    columnGap: 0,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: tokens["--border"],
  },
  componentCollection: {
    rowGap: 0,
    columnGap: 0,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: tokens["--border"],
    borderLeftWidth: 1,
    borderLeftStyle: "solid",
    borderLeftColor: tokens["--border"],
  },
  editorialCollection: {
    rowGap: 32,
    columnGap: 24,
  },
});
