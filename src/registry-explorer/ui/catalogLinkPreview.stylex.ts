import * as stylex from "@stylexjs/stylex";
import { tokens } from "./tokens.stylex";

const enter = stylex.keyframes({
  from: { opacity: 0, transform: "translateY(4px) scale(0.985)" },
  to: { opacity: 1, transform: "translateY(0) scale(1)" },
});

export const previewStyles = stylex.create({
  root: {
    position: "fixed",
    zIndex: 1005,
    width: "min(380px, calc(100vw - 24px))",
    overflow: "hidden",
    pointerEvents: "none",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens["--input"],
    borderRadius: 12,
    backgroundColor: tokens["--popover"],
    boxShadow: "0 18px 48px rgb(0 0 0 / 48%), 0 2px 9px rgb(0 0 0 / 24%)",
    color: tokens["--foreground"],
    animationName: {
      default: enter,
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    animationDuration: "125ms",
    animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
    animationFillMode: "both",
    display: {
      default: "block",
      "@media (hover: none)": "none",
      "@media (width <= 639px)": "none",
    },
  },
  instant: {
    animationName: "none",
  },
  content: {
    display: "grid",
  },
  visual: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 236,
    overflow: "hidden",
    backgroundColor: tokens["--preview-visual"],
    padding: 38,
  },
  image: {
    display: "block",
    width: "auto",
    height: "auto",
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
  },
  attribution: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    paddingBlock: 10,
    paddingInline: 12,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: tokens["--border"],
    color: tokens["--muted-foreground"],
    fontSize: 11,
  },
  hostname: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});
