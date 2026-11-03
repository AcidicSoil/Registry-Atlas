import * as stylex from "@stylexjs/stylex";
import { tokens } from "./tokens.stylex";

export const discoveryStyles = stylex.create({
  row: {
    display: "grid",
    gridAutoFlow: "column",
    gridAutoColumns: {
      default: "clamp(285px, calc((100% - 36px)/3), 355px)",
      "@media (width <= 720px)": "minmax(255px, 82%)",
    },
    alignItems: "start",
    width: "100%",
    maxHeight: "none",
    overflowX: "auto",
    overflowY: "clip",
    scrollSnapType: tokens["--discovery-snap-mode"],
    scrollPaddingInline: 2,
    overscrollBehaviorInline: "contain",
    scrollbarWidth: "thin",
    scrollbarColor: tokens["--scrollbar"],
    gap: 18,
    paddingBlockStart: 2,
    paddingBlockEnd: 15,
    paddingInline: 0,
  },
});
