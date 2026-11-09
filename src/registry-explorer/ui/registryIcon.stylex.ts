import * as stylex from "@stylexjs/stylex";
import { tokens } from "./tokens.stylex";

export const iconStyles = stylex.create({
  shell: {
    position: "relative",
    display: "grid",
    width: 36,
    height: 36,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 36,
    placeItems: "center",
    overflow: "hidden",
    borderRadius: 9,
    backgroundColor: "transparent",
    color: tokens["--foreground"],
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1,
  },
  directory: {
    width: 40,
    height: 40,
    flexBasis: 40,
    borderRadius: 10,
  },
  detail: {
    width: 44,
    height: 44,
    flexBasis: 44,
    borderRadius: 11,
  },
  related: {
    width: 28,
    height: 28,
    flexBasis: 28,
    borderRadius: 7,
    fontSize: 10,
  },
  media: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  },
  fallback: {
    display: "grid",
    placeItems: "center",
  },
  image: {
    zIndex: 1,
    padding: 4,
    backgroundColor: "transparent",
    objectFit: "contain",
  },
});
