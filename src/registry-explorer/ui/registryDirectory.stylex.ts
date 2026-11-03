import * as stylex from "@stylexjs/stylex";
import { tokens } from "./tokens.stylex";

export const directoryOpenMarker = stylex.defineMarker();

export const directoryStyles = stylex.create({
  grid: {
    display: "grid",
    gap: 12,
  },
  gridColumns: {
    gridTemplateColumns: {
      default: "repeat(3, minmax(0, 1fr))",
      "@media (width <= 1080px)": "repeat(2, minmax(0, 1fr))",
      "@media (width <= 700px)": "minmax(0, 1fr)",
    },
  },
  gridList: {
    gridTemplateColumns: "minmax(0, 1fr)",
  },
  card: {
    display: "flex",
    minWidth: 0,
    minHeight: 158,
    flexDirection: "column",
    gap: 0,
    padding: 0,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens["--border"],
    borderRadius: 12,
    backgroundColor: tokens["--card"],
    overflow: "hidden",
  },
  cardList: {
    display: "grid",
    minHeight: 96,
    gridTemplateColumns: {
      default: "minmax(0, 1fr) auto",
      "@media (width <= 700px)": "minmax(0, 1fr)",
    },
    gridTemplateRows: "minmax(0, 1fr) auto",
    alignItems: "stretch",
  },
  open: {
    display: "grid",
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "auto",
    alignContent: "start",
    gap: 12,
    paddingBlockStart: 16,
    paddingInline: 16,
    paddingBlockEnd: 10,
    color: "inherit",
    textDecorationLine: "none",
    outlineWidth: { default: null, ":focus-visible": 2 },
    outlineStyle: { default: null, ":focus-visible": "solid" },
    outlineColor: { default: null, ":focus-visible": tokens["--primary"] },
    outlineOffset: { default: null, ":focus-visible": 3 },
    borderRadius: { default: null, ":focus-visible": 6 },
  },
  openList: {
    gridTemplateColumns: {
      default: "minmax(210px, 0.45fr) minmax(0, 1fr)",
      "@media (width <= 700px)": "minmax(0, 1fr)",
    },
    alignItems: "center",
    paddingBlockEnd: 16,
  },
  description: {
    display: "-webkit-box",
    minWidth: 0,
    margin: 0,
    overflow: "hidden",
    color: tokens["--muted-foreground"],
    fontSize: 13,
    lineHeight: 1.45,
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  heading: {
    display: "flex",
    minWidth: 0,
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: tokens["--space-3"],
    flexDirection: {
      default: "row",
      "@media (width <= 640px)": "column",
    },
  },
  identity: {
    display: "flex",
    minWidth: 0,
    alignItems: "center",
    gap: 10,
  },
  identityCopy: {
    minWidth: 0,
  },
  headingTitle: {
    margin: 0,
    overflowWrap: "anywhere",
    fontSize: 14,
    lineHeight: 1.3,
    color: {
      default: null,
      [stylex.when.ancestor(":hover", directoryOpenMarker)]: tokens["--primary"],
    },
  },
  itemCount: {
    display: "block",
    marginBlockStart: 2,
    color: tokens["--muted-foreground"],
    fontSize: 12,
  },
  meta: {
    display: "flex",
    minWidth: 0,
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    paddingBlockStart: 0,
    paddingInline: 16,
    paddingBlockEnd: 14,
    color: tokens["--muted-foreground"],
    fontSize: 11,
  },
  metaList: {
    minWidth: {
      default: 150,
      "@media (width <= 700px)": 0,
    },
    alignSelf: "center",
    padding: 16,
    borderLeftWidth: {
      default: 1,
      "@media (width <= 700px)": 0,
    },
    borderLeftStyle: "solid",
    borderLeftColor: tokens["--border"],
    borderTopWidth: { default: 0, "@media (width <= 700px)": 1 },
    borderTopStyle: "solid",
    borderTopColor: tokens["--border"],
  },
  status: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  homepage: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    color: {
      default: tokens["--muted-foreground"],
      ":hover": tokens["--primary"],
    },
    textDecorationLine: { default: "none", ":hover": "underline" },
  },
});
