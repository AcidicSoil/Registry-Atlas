import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { extname } from "node:path";

const require = createRequire(import.meta.url);

const ts = require("typescript");

const postcss = require(require.resolve("postcss", { paths: [require.resolve("stylelint")] }));

const yaml = require("yaml");

const parseValue = require(
  require.resolve("postcss-value-parser", { paths: [require.resolve("stylelint")] }),
);

const baseRef = process.argv[2] ?? "HEAD";
execFileSync("git", ["rev-parse", "--verify", baseRef], { stdio: "ignore" });
const changed = execFileSync("git", ["diff", "--name-only", "--diff-filter=M", "-z", baseRef], {
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);

function astSignature(path, text) {
  const kind =
    path.endsWith(".ts") || path.endsWith(".mts") || path.endsWith(".tsx")
      ? ts.ScriptKind.TS
      : ts.ScriptKind.JS;

  const file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, kind);
  const errors = file.parseDiagnostics.map((d) => d.code).sort();
  const nodes = [];

  function visit(node) {
    if (ts.isParenthesizedExpression(node) || ts.isParenthesizedTypeNode(node)) {
      visit(node.expression ?? node.type);

      return;
    }

    const objectKey =
      node.parent && ts.isPropertyAssignment(node.parent) && node.parent.name === node;

    const token = { kind: objectKey ? "propertyName" : node.kind };

    if (
      ts.isIdentifier(node) ||
      ts.isStringLiteral(node) ||
      ts.isNumericLiteral(node) ||
      ts.isRegularExpressionLiteral(node) ||
      ts.isTemplateLiteralToken(node) ||
      ts.isJsxText(node)
    )
      token.value = node.text;
    nodes.push(token);
    ts.forEachChild(node, visit);
  }

  visit(file);

  return JSON.stringify({ errors, nodes });
}

function cssSignature(text) {
  const normalizeValue = (value) => {
    function walk(items) {
      return items.map((item) => [
        item.type,
        item.type === "word"
          ? item.value
              .replace(/#[\da-f]{3,8}\b/gi, (hex) => hex.toLowerCase())
              .replace(/^\.(\d+)$/, "0.$1")
          : item.value,
        item.nodes ? walk(item.nodes) : null,
      ]);
    }

    return walk(parseValue(value).nodes);
  };

  const nodes = [];
  postcss.parse(text).walk((node) => {
    if (node.type === "decl") {
      nodes.push(["decl", node.prop, normalizeValue(node.value), node.important]);
    } else if (node.type === "rule") {
      nodes.push(["rule", node.selector.replace(/\s+/g, " ").replace(/,\s+/g, ",")]);
    } else if (node.type === "atrule") {
      nodes.push(["at", node.name, node.params.replace(/\s*([<>]=|[():,])\s*/g, "$1")]);
    } else if (node.type === "comment") {
      nodes.push(["comment", node.text.trim()]);
    }
  });

  return JSON.stringify(nodes);
}

// Explicit behavior-equivalent test edits reviewed separately from formatting.
// These assertions now accept formatting-independent HTML and quote syntax.
const reviewedTestChanges = new Set([
  "tests/registry-explorer/appShellBranding.test.ts",
  "tests/registry-explorer/nativeMobileDialog.test.ts",
  "tests/registry-explorer/shellDomContract.test.ts",
]);

const byType = {};
const errors = [];

for (const path of changed) {
  const ext = extname(path).toLowerCase();
  const before = execFileSync("git", ["show", `${baseRef}:${path}`], { encoding: "utf8" });
  const after = readFileSync(path, "utf8");
  byType[ext] = (byType[ext] ?? 0) + 1;

  let equal = true;

  if (
    [".oxfmtrc.json", "package.json", "pnpm-lock.yaml", ".design/standards.json"].includes(path)
  ) {
    continue; // Approved tooling changes and protected compliance metadata are not format-only.
  }
  if (reviewedTestChanges.has(path)) continue; // Regression-tested semantic assertion upgrades.

  if ([".ts", ".tsx", ".mts", ".js", ".mjs", ".cjs"].includes(ext)) {
    equal = astSignature(path, before) === astSignature(path, after);
  } else if ([".json", ".webmanifest", ".jsonc"].includes(ext)) {
    const parse =
      ext === ".jsonc" ? (value) => ts.parseConfigFileTextToJson(path, value).config : JSON.parse;

    equal = JSON.stringify(parse(before)) === JSON.stringify(parse(after));
  } else if ([".yaml", ".yml"].includes(ext)) {
    equal = JSON.stringify(yaml.parse(before)) === JSON.stringify(yaml.parse(after));
  } else if (ext === ".css") {
    equal = cssSignature(before) === cssSignature(after);
  }

  if (!equal) errors.push(path);
}

console.log(
  JSON.stringify(
    {
      trackedChanged: changed.length,
      byType,
      reviewedTestChanges: [...reviewedTestChanges],
      structuralMismatches: errors,
    },
    null,
    2,
  ),
);

if (errors.length > 0) process.exitCode = 1;
