You are a senior developer. You produce optimized, maintainable code that follows best practices. 

Your task is to review the current codebase and fix the current issues.

Current Issue:
<issue>
{{MESSAGE}}
</issue>

Rules:
- Keep your suggestions concise and focused. Avoid unnecessary explanations or fluff. 
- Your output should be a series of specific, actionable changes.

When approaching this task:
1. Carefully review the provided code.
2. Identify the area thats raising this issue or error and provide a fix.
3. Consider best practices for the specific programming language used.

For each suggested change, provide:
1. A short description of the change (one line maximum).
2. The modified code block.

Use the following format for your output:

[Short Description]
```[language]:[path/to/file]
[code block]
```

Begin fixing the codebase provide your solutions.

My current codebase:
<current_codebase>
<source_code>
codefetch.config.mjs
```
/** @type {import('codefetch').CodefetchConfig} */
export default {
  "projectTree": 5,
  "tokenLimiter": "truncated",
  "defaultPromptFile": "default.md"
};
```

index.html
```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Component Registry Explorer</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <!-- Optional: custom font -->
  <!-- <link href="https://fonts.googleapis.com/css2?family=Chivo:wght@300;400;600;700&display=swap" rel="stylesheet"> -->

  <style>
    :root {
      --bg: #05060a;
      --bg-elevated: #0b0d15;
      --bg-soft: #101320;
      --bg-softer: #151827;
      --border-subtle: rgba(255, 255, 255, 0.06);
      --border-strong: rgba(255, 255, 255, 0.2);
      --accent: #ffd95e;
      --accent-soft: rgba(255, 217, 94, 0.15);
      --accent-secondary: #65d4ff;
      --text-main: #f5f5f7;
      --text-muted: #9ea0b6;
      --text-softer: #6a6d84;
      --chip-bg: rgba(255, 255, 255, 0.06);
      --chip-border: rgba(255, 255, 255, 0.12);
      --radius-lg: 16px;
      --radius-md: 12px;
      --radius-pill: 999px;
      --shadow-soft: 0 18px 45px rgba(0, 0, 0, 0.6);
      --shadow-halo: 0 0 0 1px rgba(255, 255, 255, 0.03);
      --transition-fast: 150ms ease-out;
      --transition-med: 220ms ease-out;
    }

    * {
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
    }

    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      background: radial-gradient(circle at top, #151735 0, #05060a 50%, #020308 100%);
      color: var(--text-main);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Chivo", sans-serif;
    }

    body {
      display: flex;
      align-items: stretch;
      justify-content: center;
      padding: 16px;
    }

    #app {
      width: 100%;
      max-width: 1320px;
      background: radial-gradient(circle at top left, rgba(255, 217, 94, 0.12), transparent 52%),
                  radial-gradient(circle at bottom right, rgba(101, 212, 255, 0.1), transparent 55%),
                  linear-gradient(145deg, #05060a 0, #05060a 40%, #05060a 100%);
      border-radius: 28px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow:
        0 24px 80px rgba(0, 0, 0, 0.85),
        0 0 0 1px rgba(255, 255, 255, 0.02);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Ambient grid overlay */
    #app::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 40px 40px;
      opacity: 0.4;
      pointer-events: none;
      mix-blend-mode: soft-light;
    }

    /* Noise texture */
    #app::after {
      content: "";
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='noStitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.28'/%3E%3C/svg%3E");
      mix-blend-mode: soft-light;
      opacity: 0.35;
      pointer-events: none;
    }

    .app-inner {
      position: relative;
      z-index: 1;
      padding: 18px 22px 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      height: 100%;
    }

    header.app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-logo {
      width: 32px;
      height: 32px;
      border-radius: 22px;
      background:
        conic-gradient(from 220deg, #ffd95e, #65d4ff, #8b6cff, #ffd95e);
      padding: 1px;
      box-shadow:
        0 0 0 1px rgba(255, 255, 255, 0.14),
        0 12px 30px rgba(0, 0, 0, 0.75);
    }

    .brand-logo-inner {
      width: 100%;
      height: 100%;
      border-radius: inherit;
      background: radial-gradient(circle at 30% 20%, #05060a 0, #05060a 50%, #181b2f 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent);
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .brand-title {
      font-size: 17px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .brand-subtitle {
      font-size: 12px;
      color: var(--text-muted);
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .pill-meta {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      font-size: 11px;
      border-radius: 999px;
      background: rgba(10, 13, 24, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.15em;
    }

    .pill-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 0 5px rgba(255, 217, 94, 0.18);
    }

    .search-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 10px;
      background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.06), transparent 60%),
                  radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.04), transparent 40%),
                  rgba(8, 10, 20, 0.95);
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: var(--shadow-halo);
      width: 260px;
    }

    .search-icon {
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: radial-gradient(circle at 25% 25%, #ffd95e, #f7b94a);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
      font-size: 11px;
      font-weight: 700;
    }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      color: var(--text-main);
      font-size: 13px;
    }

    .search-input::placeholder {
      color: var(--text-muted);
    }

    .tabs {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px;
      border-radius: 999px;
      background: rgba(9, 10, 20, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: var(--shadow-halo);
    }

    .tab {
      position: relative;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 12px;
      padding: 5px 11px;
      border-radius: 999px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: color var(--transition-fast), transform var(--transition-fast);
    }

    .tab span.label {
      text-transform: uppercase;
      letter-spacing: 0.14em;
    }

    .tab span.badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-softer);
    }

    .tab.tab-active {
      color: var(--bg);
      transform: translateY(-1px);
    }

    .tab.tab-active::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(120deg, #ffd95e, #65d4ff);
      border-radius: inherit;
      z-index: -1;
      box-shadow:
        0 0 0 1px rgba(0, 0, 0, 0.7),
        0 12px 30px rgba(0, 0, 0, 0.8);
    }

    .tab.tab-active span.badge {
      background: rgba(0, 0, 0, 0.16);
      border-color: rgba(0, 0, 0, 0.4);
      color: rgba(0, 0, 0, 0.75);
    }

    main {
      flex: 1;
      display: grid;
      grid-template-columns: minmax(0, 0.95fr) minmax(0, 2.05fr);
      gap: 14px;
      padding-top: 4px;
      padding-bottom: 6px;
      min-height: 0;
    }

    aside {
      border-radius: 20px;
      background: linear-gradient(150deg, rgba(12, 15, 30, 0.96), rgba(6, 7, 16, 0.96));
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 14px 12px 12px;
      box-shadow: var(--shadow-soft);
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 0;
      position: relative;
      overflow: hidden;
    }

    aside::before {
      content: "";
      position: absolute;
      inset: -40%;
      background: conic-gradient(from 180deg, rgba(255, 217, 94, 0.12), transparent, rgba(101, 212, 255, 0.12), transparent, transparent);
      opacity: 0.25;
      filter: blur(42px);
      pointer-events: none;
    }

    .aside-inner {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 0;
    }

    .aside-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 6px;
    }

    .aside-title {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--text-muted);
    }

    .aside-summary {
      font-size: 11px;
      color: var(--text-softer);
    }

    .pill-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 2px;
    }

    .pill-item {
      font-size: 12px;
      padding: 6px 9px;
      border-radius: var(--radius-pill);
      border: 1px solid rgba(255, 255, 255, 0.18);
      background: rgba(5, 7, 16, 0.98);
      color: var(--text-muted);
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      cursor: pointer;
      min-width: 0;
      position: relative;
      overflow: hidden;
      transition:
        background var(--transition-med),
        color var(--transition-fast),
        border-color var(--transition-fast),
        transform var(--transition-fast),
        box-shadow var(--transition-fast);
    }

    .pill-item::before {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at top left, rgba(255, 217, 94, 0.28), transparent 50%);
      opacity: 0;
      transition: opacity var(--transition-med);
      pointer-events: none;
    }

    .pill-item:hover {
      transform: translateY(-1px);
      border-color: rgba(255, 255, 255, 0.32);
      box-shadow: 0 14px 32px rgba(0, 0, 0, 0.85);
    }

    .pill-item:hover::before {
      opacity: 1;
    }

    .pill-item.pill-active {
      border-color: rgba(255, 217, 94, 0.85);
      color: var(--bg);
      background: radial-gradient(circle at 0% 0%, #ffd95e, #f6b24b);
      box-shadow:
        0 0 0 1px rgba(0, 0, 0, 0.5),
        0 16px 42px rgba(0, 0, 0, 0.9);
    }

    .pill-item-label {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .pill-item-count {
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.26);
      color: rgba(255, 255, 255, 0.86);
    }

    .aside-footer {
      font-size: 11px;
      color: var(--text-softer);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      padding-top: 6px;
      border-top: 1px dashed rgba(255, 255, 255, 0.12);
    }

    .muted-em {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--text-softer);
    }

    .aside-footer span.key {
      padding: 2px 6px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: rgba(0, 0, 0, 0.3);
      font-size: 10px;
      color: var(--text-muted);
    }

    section.content {
      border-radius: 20px;
      background: radial-gradient(circle at top, rgba(255, 255, 255, 0.04), transparent 56%),
                  linear-gradient(160deg, rgba(10, 12, 22, 0.96), rgba(4, 5, 12, 0.98));
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 14px 14px 12px;
      box-shadow: var(--shadow-soft);
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .content-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .content-heading {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .content-title {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.16em;
    }

    .content-subtitle {
      font-size: 12px;
      color: var(--text-softer);
    }

    .content-metrics {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: var(--text-softer);
    }

    .content-metrics span {
      padding: 4px 8px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(0, 0, 0, 0.35);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .content-metrics span strong {
      color: var(--accent);
      font-weight: 600;
    }

    .content-body {
      flex: 1;
      min-height: 0;
      border-radius: 14px;
      background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.02), transparent 56%),
                  rgba(6, 7, 16, 0.96);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 10px 10px 9px;
      overflow: hidden;
      position: relative;
    }

    .scroll-region {
      position: absolute;
      inset: 0;
      padding: 4px 2px 3px 2px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
    }

    .scroll-region::-webkit-scrollbar {
      width: 6px;
    }

    .scroll-region::-webkit-scrollbar-track {
      background: transparent;
    }

    .scroll-region::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.24);
      border-radius: 999px;
    }

    .registry-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 8px;
      align-content: flex-start;
      animation: fadeInUp 240ms ease-out;
    }

    .registry-card {
      border-radius: 13px;
      background: linear-gradient(150deg, rgba(15, 18, 32, 0.98), rgba(6, 7, 14, 0.98));
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 9px 9px 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8);
      position: relative;
      overflow: hidden;
      transition:
        transform var(--transition-med),
        box-shadow var(--transition-med),
        border-color var(--transition-med),
        background var(--transition-med);
    }

    .registry-card::before {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at top left, rgba(255, 217, 94, 0.22), transparent 60%);
      opacity: 0;
      transition: opacity var(--transition-med);
      pointer-events: none;
    }

    .registry-card:hover {
      transform: translateY(-2px) translateZ(0);
      border-color: rgba(255, 217, 94, 0.85);
      box-shadow:
        0 18px 40px rgba(0, 0, 0, 0.9),
        0 0 0 1px rgba(0, 0, 0, 0.8);
      background: linear-gradient(155deg, rgba(20, 22, 38, 0.98), rgba(7, 9, 16, 0.98));
    }

    .registry-card:hover::before {
      opacity: 1;
    }

    .registry-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 6px;
    }

    .registry-name {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .registry-url {
      font-size: 11px;
      color: var(--accent-secondary);
      text-decoration: none;
      border-bottom: 1px dashed rgba(101, 212, 255, 0.6);
      padding-bottom: 1px;
      align-self: flex-start;
    }

    .registry-url:hover {
      text-decoration: none;
      border-bottom-style: solid;
    }

    .registry-description {
      font-size: 11px;
      color: var(--text-softer);
      line-height: 1.4;
    }

    .chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }

    .chip {
      font-size: 10px;
      padding: 3px 7px;
      border-radius: 999px;
      border: 1px solid var(--chip-border);
      background: var(--chip-bg);
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      white-space: nowrap;
    }

    .chip.chip-focus {
      border-color: rgba(255, 217, 94, 0.65);
      color: var(--accent);
      background: rgba(255, 217, 94, 0.08);
    }

    .chip.chip-tag {
      border-style: dashed;
    }

    .chip.chip-compact {
      text-transform: none;
      letter-spacing: 0;
      font-size: 9px;
    }

    .registry-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
      margin-top: 3px;
    }

    .registry-meta {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      color: var(--text-softer);
    }

    .registry-meta span {
      padding: 2px 5px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: rgba(0, 0, 0, 0.3);
    }

    .tag-row-compact {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      justify-content: flex-end;
    }

    .empty-state {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 10px;
      color: var(--text-softer);
      text-align: center;
      font-size: 12px;
    }

    .empty-state-icon {
      width: 42px;
      height: 42px;
      border-radius: 16px;
      border: 1px dashed rgba(255, 255, 255, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      margin-bottom: 2px;
    }

    .empty-state strong {
      color: var(--accent);
    }

    /* Component view: list layout */
    .component-group-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      animation: fadeInUp 240ms ease-out;
    }

    .component-group {
      border-radius: 13px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: linear-gradient(145deg, rgba(17, 20, 36, 0.98), rgba(4, 5, 12, 0.98));
      padding: 8px 9px 7px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.85);
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .component-group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }

    .component-name {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: var(--accent-secondary);
    }

    .component-count {
      font-size: 11px;
      color: var(--text-softer);
    }

    .component-registry-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 6px;
      padding: 4px 0;
      border-top: 1px dashed rgba(255, 255, 255, 0.12);
      font-size: 11px;
    }

    .component-registry-row:first-of-type {
      border-top: none;
      padding-top: 0;
    }

    .component-registry-main {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .component-registry-name {
      font-weight: 500;
    }

    .component-registry-description {
      color: var(--text-softer);
      font-size: 10px;
    }

    .component-registry-meta {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 4px;
    }

    /* Matrix view */
    .matrix-wrapper {
      width: 100%;
      overflow-x: auto;
      padding-bottom: 4px;
      animation: fadeInUp 240ms ease-out;
    }

    table.matrix {
      border-collapse: separate;
      border-spacing: 0;
      min-width: 520px;
      width: 100%;
      font-size: 11px;
      color: var(--text-muted);
      background: rgba(10, 12, 24, 0.98);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.9);
    }

    table.matrix thead {
      background: linear-gradient(135deg, rgba(255, 217, 94, 0.12), rgba(101, 212, 255, 0.1));
    }

    table.matrix th,
    table.matrix td {
      padding: 6px 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      border-right: 1px solid rgba(255, 255, 255, 0.06);
      text-align: left;
    }

    table.matrix th:last-child,
    table.matrix td:last-child {
      border-right: none;
    }

    table.matrix thead th {
      text-transform: uppercase;
      letter-spacing: 0.14em;
      font-size: 10px;
      color: var(--text-main);
      background: rgba(0, 0, 0, 0.24);
    }

    table.matrix tbody tr:last-child td {
      border-bottom: none;
    }

    table.matrix tbody tr:nth-child(odd) td {
      background: rgba(255, 255, 255, 0.01);
    }

    .matrix-registry-name {
      font-weight: 500;
      color: var(--text-main);
    }

    .matrix-icon {
      font-size: 14px;
      text-align: center;
      color: var(--accent);
    }

    .matrix-empty {
      color: rgba(255, 255, 255, 0.25);
      font-size: 12px;
      text-align: center;
    }

    /* View-specific aside text variations */
    .aside-summary span.em {
      color: var(--accent-secondary);
      font-weight: 500;
    }

    /* Animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Responsive */
    @media (max-width: 900px) {
      main {
        grid-template-columns: minmax(0, 1fr);
        grid-auto-rows: auto;
      }
    }

    @media (max-width: 720px) {
      .app-inner {
        padding: 14px;
      }

      header.app-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-right {
        width: 100%;
        justify-content: space-between;
      }

      .search-bar {
        flex: 1;
        width: auto;
      }
    }

    @media (max-width: 520px) {
      body {
        padding: 8px;
      }
      #app {
        border-radius: 20px;
      }
      .brand-title {
        font-size: 15px;
      }
      .brand-subtitle {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="app-inner">
      <header class="app-header">
        <div class="brand">
          <div class="brand-logo">
            <div class="brand-logo-inner">R</div>
          </div>
          <div class="brand-text">
            <div class="brand-title">Registry Atlas</div>
            <div class="brand-subtitle">Shadcn-Based Component Index</div>
          </div>
        </div>
        <div class="header-right">
          <div class="pill-meta">
            <div class="pill-dot"></div>
            <span>Interactive SPA · Local data only</span>
          </div>
          <div class="search-bar">
            <div class="search-icon">⌕</div>
            <input
              id="searchInput"
              type="search"
              class="search-input"
              placeholder="Filter by name, focus, or tag"
            />
          </div>
          <div class="tabs" role="tablist">
            <button class="tab tab-active" data-view="focus" role="tab">
              <span class="label">By Focus</span>
              <span class="badge">Registry clusters</span>
            </button>
            <button class="tab" data-view="component" role="tab">
              <span class="label">By Component</span>
              <span class="badge">Need-based</span>
            </button>
            <button class="tab" data-view="matrix" role="tab">
              <span class="label">Matrix</span>
              <span class="badge">Coverage</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        <aside>
          <div class="aside-inner" id="aside"></div>
        </aside>
        <section class="content">
          <div class="content-header" id="contentHeader"></div>
          <div class="content-body">
            <div class="scroll-region" id="contentBody"></div>
          </div>
        </section>
      </main>
    </div>
  </div>

  <script>
    // --- Data model ----------------------------------------------------------

    const REGISTRIES = [
      {
        name: "ChatKit UI",
        url: "https://example.com/chatkit",
        description: "Focused set of AI chat surfaces: support inboxes, chat popovers, assistant consoles.",
        primary_focus: ["ai-chat", "support"],
        component_tags: [
          "chatbot", "chat-window", "message-list", "typing-indicator", "prompt-box",
          "button", "input", "badge", "avatar", "toolbar"
        ],
        framework: "React (shadcn/ui)",
        license: "MIT"
      },
      {
        name: "Minimal Primitives",
        url: "https://example.com/minimal-primitives",
        description: "Button-first primitive collection: buttons, toggles, input scaffolding.",
        primary_focus: ["buttons-and-primitives"],
        component_tags: [
          "button", "icon-button", "loading-button", "toggle", "switch",
          "input", "select", "textarea", "badge"
        ],
        framework: "React (shadcn/ui)",
        license: "MIT"
      },
      {
        name: "SaaS Admin Blocks",
        url: "https://example.com/saas-admin-blocks",
        description: "Composable admin building blocks: data tables, filters, metrics cards.",
        primary_focus: ["dashboards-and-admin", "data-display-and-tables"],
        component_tags: [
          "table", "data-grid", "filter-bar", "badge", "pagination",
          "chart", "stat-widget", "toolbar", "button"
        ],
        framework: "React (shadcn/ui)",
        license: "Commercial"
      },
      {
        name: "AuthKit UI",
        url: "https://example.com/authkit",
        description: "Authentication flows: sign-in, sign-up, magic links, profile menus.",
        primary_focus: ["auth-and-user", "forms-and-inputs"],
        component_tags: [
          "auth-form", "input", "password-input", "button",
          "stepper", "alert", "avatar", "navbar"
        ],
        framework: "React / Next.js",
        license: "MIT"
      },
      {
        name: "Navigation Shelf",
        url: "https://example.com/navigation-shelf",
        description: "Navigation-focused set: sidebars, app shells, breadcrumbs.",
        primary_focus: ["navigation", "templates-and-layouts"],
        component_tags: [
          "sidebar", "navbar", "breadcrumb", "app-shell",
          "tabs", "dropdown", "button"
        ],
        framework: "React",
        license: "MIT"
      },
      {
        name: "Story Sections",
        url: "https://example.com/story-sections",
        description: "Hero sections, grids, and editorial layouts for marketing pages.",
        primary_focus: ["marketing-sections", "templates-and-layouts"],
        component_tags: [
          "hero-section", "feature-grid", "testimonial", "cta-section",
          "button", "badge", "card"
        ],
        framework: "React",
        license: "MIT"
      },
      {
        name: "Commerce Blocks",
        url: "https://example.com/commerce-blocks",
        description: "Product cards, carts, and checkout-ready building blocks.",
        primary_focus: ["ecommerce", "forms-and-inputs"],
        component_tags: [
          "product-card", "price-badge", "cart-drawer", "mini-cart",
          "button", "input", "select", "table"
        ],
        framework: "React / Next.js",
        license: "Commercial"
      },
      {
        name: "Dataview Studio",
        url: "https://example.com/dataview-studio",
        description: "Heavy-duty data views: resizable tables, facets, and filters.",
        primary_focus: ["data-display-and-tables", "dashboards-and-admin"],
        component_tags: [
          "data-grid", "table", "column-resize", "filter-bar",
          "search-input", "tag-input", "badge", "toolbar"
        ],
        framework: "React",
        license: "MIT"
      },
      {
        name: "FormLab",
        url: "https://example.com/formlab",
        description: "Form field recipes, validation states, and multi-step flows.",
        primary_focus: ["forms-and-inputs"],
        component_tags: [
          "input", "textarea", "select", "checkbox", "radio",
          "datepicker", "stepper", "submit-button", "error-message"
        ],
        framework: "React",
        license: "MIT"
      },
      {
        name: "Utility Shelf",
        url: "https://example.com/utility-shelf",
        description: "Miscellaneous utilities: toasts, modals, drawers, and skeletons.",
        primary_focus: ["misc-utility"],
        component_tags: [
          "toast", "modal", "drawer", "skeleton", "spinner",
          "badge", "button"
        ],
        framework: "React",
        license: "MIT"
      }
    ];

    const MATRIX_COLUMNS = [
      "chatbot",
      "button",
      "input",
      "table",
      "auth-form",
      "navbar",
      "hero-section"
    ];

    const STATE = {
      currentView: "focus",          // "focus" | "component" | "matrix"
      selectedFocus: null,           // string | null
      selectedComponent: null,       // string | null
      searchTerm: ""
    };

    const root = {
      aside: document.getElementById("aside"),
      contentHeader: document.getElementById("contentHeader"),
      contentBody: document.getElementById("contentBody"),
      tabs: document.querySelectorAll(".tab"),
      searchInput: document.getElementById("searchInput")
    };

    // --- Helpers ------------------------------------------------------------

    function getUniqueFocuses() {
      const set = new Set();
      REGISTRIES.forEach(r => r.primary_focus.forEach(f => set.add(f)));
      return Array.from(set).sort();
    }

    function getComponentCounts() {
      const map = new Map();
      REGISTRIES.forEach(r => {
        r.component_tags.forEach(tag => {
          map.set(tag, (map.get(tag) || 0) + 1);
        });
      });
      const arr = Array.from(map.entries()).map(([tag, count]) => ({ tag, count }));
      arr.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.tag.localeCompare(b.tag);
      });
      return arr;
    }

    function filterRegistries(registries) {
      if (!STATE.searchTerm.trim()) return registries;
      const q = STATE.searchTerm.trim().toLowerCase();
      return registries.filter(r => {
        const haystack = [
          r.name,
          r.description,
          r.framework,
          r.license,
          ...r.primary_focus,
          ...r.component_tags
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    function focusLabel(focusKey) {
      const map = {
        "ai-chat": "AI & Chatbot",
        "support": "Support UIs",
        "forms-and-inputs": "Forms & Inputs",
        "buttons-and-primitives": "Buttons & Primitives",
        "dashboards-and-admin": "Dashboards & Admin",
        "marketing-sections": "Marketing Sections",
        "ecommerce": "Ecommerce",
        "auth-and-user": "Auth & User",
        "data-display-and-tables": "Data Display & Tables",
        "navigation": "Navigation",
        "templates-and-layouts": "Layouts & Templates",
        "misc-utility": "Utility & Misc"
      };
      return map[focusKey] || focusKey;
    }

    function componentLabel(componentKey) {
      return componentKey.replace(/-/g, " ");
    }

    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function escapeHtml(str) {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    // --- Rendering: Aside ---------------------------------------------------

    function renderAsideFocus() {
      const focuses = getUniqueFocuses();
      if (!STATE.selectedFocus && focuses.length) {
        STATE.selectedFocus = focuses[0];
      }

      const filtered = filterRegistries(REGISTRIES);
      const counts = new Map();
      filtered.forEach(r => {
        r.primary_focus.forEach(f => {
          counts.set(f, (counts.get(f) || 0) + 1);
        });
      });

      const summary =
        `<div class="aside-header">
           <div class="aside-title">Focus clusters</div>
           <div class="aside-summary">
             Registry groups by dominant <span class="em">use-case</span>.
           </div>
         </div>`;

      const pills = focuses
        .filter(f => counts.get(f) > 0)
        .map(focusKey => {
          const count = counts.get(focusKey) || 0;
          const active = STATE.selectedFocus === focusKey ? " pill-active" : "";
          return `
            <button class="pill-item${active}" data-focus="${focusKey}">
              <span class="pill-item-label">${escapeHtml(focusLabel(focusKey))}</span>
              <span class="pill-item-count">${count}</span>
            </button>
          `;
        })
        .join("");

      const footer =
        `<div class="aside-footer">
           <span class="muted-em">Filter by cluster</span>
           <span class="key">Focus → registries</span>
         </div>`;

      root.aside.innerHTML =
        summary +
        `<div class="pill-list">${pills}</div>` +
        footer;
    }

    function renderAsideComponent() {
      const componentCounts = getComponentCounts();
      if (!STATE.selectedComponent && componentCounts.length) {
        STATE.selectedComponent = componentCounts[0].tag;
      }

      const filtered = filterRegistries(REGISTRIES);
      const filteredCounts = new Map();
      filtered.forEach(r => {
        r.component_tags.forEach(tag => {
          filteredCounts.set(tag, (filteredCounts.get(tag) || 0) + 1);
        });
      });

      const summary =
        `<div class="aside-header">
           <div class="aside-title">Component index</div>
           <div class="aside-summary">
             Choose a <span class="em">component type</span> to see who ships it.
           </div>
         </div>`;

      const pills = componentCounts
        .filter(({ tag }) => filteredCounts.get(tag) > 0)
        .slice(0, 32)
        .map(({ tag }) => {
          const count = filteredCounts.get(tag) || 0;
          const active = STATE.selectedComponent === tag ? " pill-active" : "";
          return `
            <button class="pill-item${active}" data-component="${tag}">
              <span class="pill-item-label">${escapeHtml(componentLabel(tag))}</span>
              <span class="pill-item-count">${count}</span>
            </button>
          `;
        })
        .join("");

      const footer =
        `<div class="aside-footer">
           <span class="muted-em">Filter by component</span>
           <span class="key">Component → registries</span>
         </div>`;

      root.aside.innerHTML =
        summary +
        `<div class="pill-list">${pills}</div>` +
        footer;
    }

    function renderAsideMatrix() {
      const filtered = filterRegistries(REGISTRIES);
      const summary =
        `<div class="aside-header">
           <div class="aside-title">Matrix axes</div>
           <div class="aside-summary">
             Rows: <span class="em">registries</span>. Columns: <span class="em">representative components</span>.
           </div>
         </div>`;

      const registryCount = filtered.length;
      const footer =
        `<div class="aside-footer">
           <span class="muted-em">Coverage overview</span>
           <span class="key">${registryCount} registries · ${MATRIX_COLUMNS.length} columns</span>
         </div>`;

      const chips =
        `<div class="pill-list">
           ${MATRIX_COLUMNS.map(col => `
             <div class="chip chip-compact chip-tag">
               ${escapeHtml(componentLabel(col))}
             </div>
           `).join("")}
         </div>`;

      root.aside.innerHTML = summary + chips + footer;
    }

    // --- Rendering: Content header -----------------------------------------

    function renderContentHeaderFocus() {
      const filtered = filterRegistries(REGISTRIES);
      const registryCount = filtered.length;
      const clusterCount = getUniqueFocuses().length;

      root.contentHeader.innerHTML =
        `<div class="content-heading">
           <div class="content-title">Registries by focus</div>
           <div class="content-subtitle">
             Browse component registries clustered by dominant product use-case.
           </div>
         </div>
         <div class="content-metrics">
           <span><strong>${registryCount}</strong> registries</span>
           <span><strong>${clusterCount}</strong> focus groups</span>
         </div>`;
    }

    function renderContentHeaderComponent() {
      const filtered = filterRegistries(REGISTRIES);
      const registryCount = filtered.length;
      const componentCount = getComponentCounts().length;

      root.contentHeader.innerHTML =
        `<div class="content-heading">
           <div class="content-title">Registries by component</div>
           <div class="content-subtitle">
             Start from the component you need; see every registry that ships it.
           </div>
         </div>
         <div class="content-metrics">
           <span><strong>${registryCount}</strong> registries</span>
           <span><strong>${componentCount}</strong> component types</span>
         </div>`;
    }

    function renderContentHeaderMatrix() {
      const filtered = filterRegistries(REGISTRIES);
      const registryCount = filtered.length;

      root.contentHeader.innerHTML =
        `<div class="content-heading">
           <div class="content-title">Coverage matrix</div>
           <div class="content-subtitle">
             Quick scan of which registries cover core component families.
           </div>
         </div>
         <div class="content-metrics">
           <span><strong>${registryCount}</strong> registries</span>
           <span><strong>${MATRIX_COLUMNS.length}</strong> component columns</span>
         </div>`;
    }

    // --- Rendering: Content body -------------------------------------------

    function renderContentBodyFocus() {
      const filtered = filterRegistries(REGISTRIES);
      if (!filtered.length) {
        root.contentBody.innerHTML =
          `<div class="empty-state">
             <div class="empty-state-icon">⊘</div>
             <div>No registries match this filter.</div>
             <div>Clear the search filter or adjust your focus selection.</div>
           </div>`;
        return;
      }

      const registriesForFocus = STATE.selectedFocus
        ? filtered.filter(r => r.primary_focus.includes(STATE.selectedFocus))
        : filtered;

      if (!registriesForFocus.length) {
        root.contentBody.innerHTML =
          `<div class="empty-state">
             <div class="empty-state-icon">⊘</div>
             <div>No registries in this focus cluster after filtering.</div>
             <div>Try another focus cluster or clear the search filter.</div>
           </div>`;
        return;
      }

      const cards = registriesForFocus.map(r => {
        const focusChips = r.primary_focus
          .map(f => `<span class="chip chip-focus">${escapeHtml(focusLabel(f))}</span>`)
          .join("");
        const tagChips = r.component_tags.slice(0, 5)
          .map(tag => `<span class="chip chip-tag chip-compact">${escapeHtml(componentLabel(tag))}</span>`)
          .join("");
        const extraCount = r.component_tags.length - 5;
        const extraChip = extraCount > 0
          ? `<span class="chip chip-compact chip-tag">+${extraCount} more</span>`
          : "";

        return `
          <article class="registry-card">
            <div class="registry-header">
              <div>
                <div class="registry-name">${escapeHtml(r.name)}</div>
              </div>
              <a href="${escapeHtml(r.url)}" class="registry-url" target="_blank" rel="noreferrer">
                Visit
              </a>
            </div>
            <div class="registry-description">
              ${escapeHtml(r.description)}
            </div>
            <div class="chip-row">
              ${focusChips}
            </div>
            <div class="registry-footer">
              <div class="registry-meta">
                <span>${escapeHtml(r.framework)}</span>
                <span>${escapeHtml(r.license)}</span>
              </div>
              <div class="tag-row-compact">
                ${tagChips}${extraChip}
              </div>
            </div>
          </article>
        `;
      }).join("");

      root.contentBody.innerHTML =
        `<div class="registry-grid">${cards}</div>`;
    }

    function renderContentBodyComponent() {
      const filtered = filterRegistries(REGISTRIES);
      if (!filtered.length) {
        root.contentBody.innerHTML =
          `<div class="empty-state">
             <div class="empty-state-icon">⊘</div>
             <div>No registries match this filter.</div>
           </div>`;
        return;
      }

      const selected = STATE.selectedComponent;
      if (!selected) {
        root.contentBody.innerHTML =
          `<div class="empty-state">
             <div class="empty-state-icon">◎</div>
             <div>Select a component type in the left panel.</div>
           </div>`;
        return;
      }

      const registriesForComponent = filtered.filter(r =>
        r.component_tags.includes(selected)
      );

      if (!registriesForComponent.length) {
        root.contentBody.innerHTML =
          `<div class="empty-state">
             <div class="empty-state-icon">⊘</div>
             <div>No registries currently expose this component after filtering.</div>
           </div>`;
        return;
      }

      const groupsHtml = `
        <div class="component-group-list">
          <div class="component-group">
            <div class="component-group-header">
              <div class="component-name">${escapeHtml(componentLabel(selected))}</div>
              <div class="component-count">${registriesForComponent.length} registries</div>
            </div>
            <div class="component-group-body">
              ${registriesForComponent.map(r => {
                const focusTags = r.primary_focus
                  .map(f => `<span class="chip chip-focus chip-compact">${escapeHtml(focusLabel(f))}</span>`)
                  .join("");
                const extraTags = r.component_tags
                  .filter(t => t !== selected)
                  .slice(0, 3)
                  .map(t => `<span class="chip chip-tag chip-compact">${escapeHtml(componentLabel(t))}</span>`)
                  .join("");
                const extraCount = r.component_tags.length - 1 - 3;
                const moreChip = extraCount > 0
                  ? `<span class="chip chip-compact chip-tag">+${extraCount} more</span>`
                  : "";

                return `
                  <div class="component-registry-row">
                    <div class="component-registry-main">
                      <div class="component-registry-name">${escapeHtml(r.name)}</div>
                      <div class="component-registry-description">
                        ${escapeHtml(r.description)}
                      </div>
                    </div>
                    <div class="component-registry-meta">
                      ${focusTags}
                      ${extraTags}
                      ${moreChip}
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        </div>
      `;

      root.contentBody.innerHTML = groupsHtml;
    }

    function renderContentBodyMatrix() {
      const filtered = filterRegistries(REGISTRIES);
      if (!filtered.length) {
        root.contentBody.innerHTML =
          `<div class="empty-state">
             <div class="empty-state-icon">⊘</div>
             <div>No registries match this filter.</div>
           </div>`;
        return;
      }

      const rows = filtered.map(r => {
        const cells = MATRIX_COLUMNS.map(col => {
          const has = r.component_tags.includes(col);
          const icon = has ? "●" : "";
          const cls = has ? "matrix-icon" : "matrix-empty";
          return `<td class="${cls}">${icon}</td>`;
        }).join("");

        return `
          <tr>
            <td>
              <div class="matrix-registry-name">${escapeHtml(r.name)}</div>
            </td>
            ${cells}
          </tr>
        `;
      }).join("");

      const headers = MATRIX_COLUMNS.map(col =>
        `<th>${escapeHtml(componentLabel(col))}</th>`
      ).join("");

      root.contentBody.innerHTML =
        `<div class="matrix-wrapper">
           <table class="matrix">
             <thead>
               <tr>
                 <th>Registry</th>
                 ${headers}
               </tr>
             </thead>
             <tbody>
               ${rows}
             </tbody>
           </table>
         </div>`;
    }

    // --- Master render ------------------------------------------------------

    function render() {
      root.tabs.forEach(tab => {
        const view = tab.getAttribute("data-view");
        tab.classList.toggle("tab-active", view === STATE.currentView);
      });

      if (STATE.currentView === "focus") {
        renderAsideFocus();
        renderContentHeaderFocus();
        renderContentBodyFocus();
      } else if (STATE.currentView === "component") {
        renderAsideComponent();
        renderContentHeaderComponent();
        renderContentBodyComponent();
      } else {
        renderAsideMatrix();
        renderContentHeaderMatrix();
        renderContentBodyMatrix();
      }
    }

    // --- Event wiring -------------------------------------------------------

    root.tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const view = tab.getAttribute("data-view");
        if (view && view !== STATE.currentView) {
          STATE.currentView = view;
          render();
        }
      });
    });

    root.searchInput.addEventListener("input", e => {
      STATE.searchTerm = e.target.value || "";
      render();
    });

    document.addEventListener("click", e => {
      const focusButton = e.target.closest("[data-focus]");
      if (focusButton) {
        const focusKey = focusButton.getAttribute("data-focus");
        if (focusKey && focusKey !== STATE.selectedFocus) {
          STATE.selectedFocus = focusKey;
          STATE.currentView = "focus";
          render();
        }
        return;
      }

      const componentButton = e.target.closest("[data-component]");
      if (componentButton) {
        const tagKey = componentButton.getAttribute("data-component");
        if (tagKey && tagKey !== STATE.selectedComponent) {
          STATE.selectedComponent = tagKey;
          STATE.currentView = "component";
          render();
        }
      }
    });

    // --- Initial render -----------------------------------------------------

    render();
  </script>
</body>
</html>
```

package.json
```
{
  "name": "registry-atlas",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "code": "codefetch --exclude-dir docs -o src.md"
  },
  "devDependencies": {
    "codefetch": "^2.2.0",
    "typescript": "~5.9.3",
    "vite": "^7.2.4"
  }
}
```

tsconfig.json
```
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

src/counter.ts
```
export function setupCounter(element: HTMLButtonElement) {
  let counter = 0
  const setCounter = (count: number) => {
    counter = count
    element.innerHTML = `count is ${counter}`
  }
  element.addEventListener('click', () => setCounter(counter + 1))
  setCounter(0)
}
```

src/main.ts
```
import './style.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
```

src/style.css
```
:root {
  font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  font-weight: 500;
  color: #646cff;
  text-decoration: inherit;
}
a:hover {
  color: #535bf2;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
}

#app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vanilla:hover {
  filter: drop-shadow(0 0 2em #3178c6aa);
}

.card {
  padding: 2em;
}

.read-the-docs {
  color: #888;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}
button:hover {
  border-color: #646cff;
}
button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
  a:hover {
    color: #747bff;
  }
  button {
    background-color: #f9f9f9;
  }
}
```

docs/Community registry overview.md
```
# Shadcn Community registry overview

I’ve completed a detailed survey of every community registry in the shadcn/ui directory. The report below lists each registry, its official URL, and summarizes the main component categories provided—ranging from AI chat interfaces and crypto wallet widgets to general UI primitives, rich-text editors, payment flows, animated effects, and more. This should help you quickly identify the right registries for different use cases.

shadcn/ui community registries overview
=======================================

The shadcn/ui registry directory lists many community registries that can be added to projects via `npx shadcn add @<registry>/<component>`[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=Discover%20community%20registries%20for%20shadcn%2Fui,components%20and%20blocks). Below is a comprehensive summary of every registry in the directory. For each registry the URL is recorded and the major categories of components provided are summarised. When the registry’s website could not be accessed, the description from the directory page is used for context.

@8bitcn – [https://www.8bitcn.com](https://www.8bitcn.com)
----------------------------------------------------------

A set of **8‑bit‑styled retro components** for game‑like interfaces[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%408bitcn). Categories include:

* **Game UI primitives:** retro buttons, dropdown menus, quest logs and pixel‑styled forms.

* **Health & status indicators:** enemy health bars, mana bars and retro progress bars.

* **Navigation & layout:** accordions, tabs, menus, sidebars and retro mode switchers.

* **Feedback & overlays:** alert dialogs, alerts, toasts and modal dialogs.

* **Data display:** cards, tables, charts and carousels.

@abui – [https://abui.io](https://abui.io)
------------------------------------------

Described as a **shadcn‑compatible registry of reusable components, blocks and utilities conforming to Vercel’s components.build specification**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40abui). Categories:

* **General UI components:** buttons, inputs, forms and navigation elements.

* **Blocks & sections:** hero sections, pricing tables, testimonials and dashboards.

* **Utilities:** layout helpers and styling utilities to work with Vercel’s components.build.

@abstract – [https://build.abs.xyz](https://build.abs.xyz)
----------------------------------------------------------

A collection of **React components for the most common crypto patterns**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40abstract), used to build decentralized‑app interfaces. Categories:

* **Wallet & authentication:** connect wallet buttons, SIWE (Sign‑In With Ethereum) and onboarding dialogs.

* **Session keys:** components for session key management and signing transactions.

* **Portal features:** user profiles, voting interfaces and contract management.

* **AI & rules:** helpers for configuring contracts and AI tool rules.

* **Experimental:** optimistic transaction components and utilities.

@aceternity – [https://ui.aceternity.com](https://ui.aceternity.com)
--------------------------------------------------------------------

A modern component library built with **Tailwind CSS** and **Motion for React**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40aceternity). It focuses on unique, animated components for landing pages:

* **Animated cards & effects:** tooltips, parallax cards, hover cards and perspective scroll effects.

* **Background & noise effects:** animated gradients, dotted backgrounds and noise textures.

* **Templates & layouts:** portfolio and SaaS templates (Pro) with pre‑built sections.

* **Micro‑interactions:** buttons with motion, scroll indicators and interactive sections.

@aevr – [https://ui.aevr.space](https://ui.aevr.space)
------------------------------------------------------

A small collection of **beautiful, accessible, production‑ready components and primitives for React/Next.js**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40aevr). Categories:

* **Buttons, cards & info boxes:** versatile primitives with multiple variants and sizes.

* **Hooks & utilities:** React hooks for handling state and behaviour.

* **Accessible patterns:** components built with accessibility and customization in mind.

@ai‑blocks – [https://webllm.org](https://webllm.org)
-----------------------------------------------------

Provides **AI components for the web** built on WebLLM[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40ai). No server or API keys are required. Categories:

* **Chat interfaces:** ready‑made chat UIs for interacting with local LLMs in the browser.

* **Prompt widgets:** components for sending prompts and receiving model responses.

* **AI tool panels:** blocks that embed LLM‑powered summarisation, translation and question‑answer tools.

* **Status indicators:** loading spinners and error messages tailored for AI inference.

@ai‑elements – [https://ai-sdk.dev](https://ai-sdk.dev)
-------------------------------------------------------

Offers **pre‑built components like conversations, messages and more to build AI‑native applications faster**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40ai). Categories:

* **Conversation UIs:** chat windows, message lists and conversation threads.

* **AI assistant primitives:** message input bars, streaming response bubbles and avatars.

* **Utilities:** components for conversation history, role tags and context switching.

@algolia – [https://sitesearch.algolia.com](https://sitesearch.algolia.com)
---------------------------------------------------------------------------

Provides **AI search infrastructure** components[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40algolia). Categories:

* **Search boxes & autocomplete:** pre‑configured search bars with suggestions.

* **Results lists:** components for displaying search results with highlighting.

* **Filters & facets:** UI for filtering and refining results.

* **Analytics dashboards:** components to visualise search metrics.

@aliimam – [https://aliimam.in](https://aliimam.in)
---------------------------------------------------

A personal registry focusing on **digital experiences**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40aliimam). Categories:

* **Portfolio components:** hero sections, project showcases and contact forms.

* **Brand & product UI:** components for presenting apps, websites and brand storytelling.

* **Interactive elements:** animations and interactions used in personal projects.

@animate‑ui – [https://animate-ui.com](https://animate-ui.com)
--------------------------------------------------------------

A fully **animated, open‑source React component distribution**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40animate). Categories:

* **Animated primitives:** buttons, icons and forms with built‑in motion.

* **Motion components:** carousels, accordions and modals with transitions.

* **Icon library:** animated icons and emoji replacements.

@assistant‑ui – [https://www.assistant-ui.com](https://www.assistant-ui.com)
----------------------------------------------------------------------------

Offers **Radix‑style React primitives for AI chat with adapters**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40assistant). Categories:

* **Chat primitives:** message lists, input bars and typing indicators.

* **Adapters:** components that integrate with AI SDKs, LangGraph, Mastra and custom back‑ends.

* **Theming & accessibility:** customizable tokens and accessible patterns.

@better‑upload – [https://better-upload.com](https://better-upload.com)
-----------------------------------------------------------------------

Provides **simple and easy file uploads for React**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40better). Categories:

* **File upload buttons & drop zones:** drag‑and‑drop areas and upload buttons.

* **Progress indicators:** progress bars and status feedback for uploads.

* **Storage integration:** adapters for S3‑compatible storage services.

@basecn – [https://basecn.dev](https://basecn.dev)
--------------------------------------------------

Distributes **beautifully crafted shadcn/ui components powered by Base UI**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40basecn). Categories:

* **General UI primitives:** buttons, inputs, selects and tabs.

* **Navigation:** menus, breadcrumbs, sidebars and app bars.

* **Data display:** tables, charts and cards.

* **Theming & tokens:** Base UI styling tokens integrated with Shadcn.

@billingsdk – [https://billingsdk.com](https://billingsdk.com)
--------------------------------------------------------------

An open‑source library for **SaaS billing and payments**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40billingsdk). Categories:

* **Subscription management:** plan selectors and plan switching.

* **Invoicing & billing:** invoice lists, billing history and payment status.

* **Checkout forms:** payment forms integrating Stripe, PayPal and Adyen.

* **Usage‑based pricing:** dashboards and usage calculators.

@blocks – [https://blocks.so](https://blocks.so)
------------------------------------------------

Provides **clean, modern application building blocks**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40blocks). Categories:

* **Section blocks:** hero sections, feature grids, pricing tables and call‑to‑action.

* **Admin blocks:** dashboards, profile settings and lists.

* **Utility blocks:** footers, headers and FAQs.

@clerk – [https://clerk.com](https://clerk.com)
-----------------------------------------------

A registry for **authentication and user management**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=Clerk). Categories:

* **Sign‑in and sign‑up forms:** social login and email/password forms.

* **User profile widgets:** account management, user avatars and session lists.

* **Security components:** multi‑factor authentication and password reset flows.

@coss – [https://coss.com](https://coss.com)
--------------------------------------------

A **modern UI component library built on top of Base UI for developers and AI**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40coss). Categories:

* **General UI primitives:** buttons, forms, navigation and tables.

* **AI helpers:** components integrating AI features like chat or suggestions.

* **Design system tokens:** style primitives aligning with Base UI.

@creative‑tim – [https://www.creative-tim.com](https://www.creative-tim.com)
----------------------------------------------------------------------------

Offers a **collection of open‑source UI components, blocks and AI agents**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40creative). Categories:

* **Dashboard & admin templates:** charts, tables and user cards.

* **Landing page sections:** heroes, pricing, testimonials and portfolios.

* **AI agents:** pre‑built chatbots and assistant components.

* **Design themes:** multiple color schemes and themes.

@cult‑ui – [https://www.cult-ui.com](https://www.cult-ui.com)
-------------------------------------------------------------

A **curated set of shadcn‑compatible, headless and composable components animated with Framer Motion**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40cult). Categories:

* **Headless primitives:** accordions, dialogs and dropdowns without preset styling.

* **Animation wrappers:** hooks and components that animate headless primitives.

* **Composable layouts:** stack and grid utilities for building custom UIs.

@diceui – [https://www.diceui.com](https://www.diceui.com)
----------------------------------------------------------

Provides **accessible components built with React, TypeScript and Tailwind CSS**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40diceui). Categories:

* **Form controls:** inputs, selects, checkboxes and radio groups.

* **Layout:** grids, cards, accordions and tabs.

* **Feedback:** alerts, notifications and skeleton loaders.

@doras‑ui – [https://ui.doras.to](https://ui.doras.to)
------------------------------------------------------

A collection of **beautiful, reusable component blocks built with React**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40doras). Categories:

* **Marketing blocks:** hero sections, pricing tables, testimonials and features.

* **Dashboard blocks:** cards, lists and progress bars.

* **Utility blocks:** navigation bars, footers and call‑to‑action sections.

@elements – [https://www.tryelements.dev](https://www.tryelements.dev)
----------------------------------------------------------------------

Full‑stack components that go **beyond UI**; they add **auth, monetization, uploads and AI**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40elements). Categories:

* **Authentication modules:** sign‑in, sign‑up and user management.

* **Payment & monetization:** pricing tables, checkout flows and billing management.

* **Upload utilities:** file uploaders and media libraries.

* **AI integrations:** chat, AI assistants and generative content tools.

@elevenlabs‑ui – [https://ui.elevenlabs.io](https://ui.elevenlabs.io)
---------------------------------------------------------------------

A collection of **agent and audio components**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=ElevenLabs). Categories:

* **Speech & audio controls:** audio players, waveform visualisers and microphone inputs.

* **Agent UIs:** chat and assistant components with voice support.

* **Customization tools:** theme and voice configuration components.

@efferd – [https://efferd.com](https://efferd.com)
--------------------------------------------------

Offers **beautifully crafted shadcn/UI blocks** for modern websites[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40efferd). Categories:

* **Website sections:** hero sections, features, testimonials and CTAs.

* **Pricing & comparison:** pricing tables and comparison grids.

* **Landing page templates:** pre‑styled page layouts.

@eldoraui – [https://eldoraui.site](https://eldoraui.site)
----------------------------------------------------------

A **modern UI component library** built with TypeScript, Tailwind CSS and Framer Motion[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40eldoraui). Categories:

* **Primitives:** buttons, toggles, inputs and selects.

* **Navigation:** menus, tabs and sidebars.

* **Feedback:** alerts, spinners and progress bars.

* **Animated components:** modals, carousels and collapsible sections.

@formcn – [https://formcn.dev](https://formcn.dev)
--------------------------------------------------

Designed to **build production‑ready forms** with shadcn components[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40formcn). Categories:

* **Form fields:** text, number, select, date and file inputs.

* **Validation:** error messages and validation helpers.

* **Multi‑step wizards:** stepper components with progress indicators.

* **Submission flows:** buttons, loaders and success/error states.

@gaia – [https://ui.heygaia.io](https://ui.heygaia.io)
------------------------------------------------------

Provides **production‑ready UI components for building AI assistants and conversational interfaces**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40gaia). Categories:

* **Chat UIs:** message threads, avatars and input boxes.

* **Voice & audio integration:** components for speech input/output.

* **Conversation layouts:** panels for user queries and agent responses.

* **Assistant avatars & personas:** visual identities for AI agents.

@glass‑ui – [https://glass-ui.crenspire.com](https://glass-ui.crenspire.com)
----------------------------------------------------------------------------

Distributes **40+ glassmorphic React/TypeScript components** with Apple‑inspired design[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40glass). Categories:

* **Cards & panels:** frosted glass cards, modals and sidebars.

* **Buttons & toggles:** glass‑styled buttons with glow and ripple effects.

* **Navigation:** translucent nav bars, tabs and menus.

* **Themes & utilities:** glassmorphism theme support and customisation helpers.

@ha‑components – [https://hacomponents.keshuac.com](https://hacomponents.keshuac.com)
-------------------------------------------------------------------------------------

Provides **customisable components to build Home Assistant dashboards**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40ha). Categories:

* **Dashboard widgets:** gauge cards, sensor displays and thermostats.

* **Control panels:** switches, buttons and toggles for smart devices.

* **Layouts:** grid and stack layouts for dashboards.

@hextaui – [https://hextaui.com](https://hextaui.com)
-----------------------------------------------------

Offers **ready‑to‑use foundation components/blocks** built on shadcn/ui[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40hextaui). Categories:

* **Base components:** buttons, inputs, selects and tabs.

* **Blocks:** hero sections, pricing tables and feature lists.

* **Motion primitives:** animated overlays and modals.

@hooks – [https://shadcn-hooks.vercel.app](https://shadcn-hooks.vercel.app)
---------------------------------------------------------------------------

A **comprehensive React hooks collection** built with Shadcn[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40hooks). Categories:

* **State & effect hooks:** useLocalStorage, useMediaQuery, useDarkMode.

* **UI hooks:** useDropdown, useModal and useToast.

* **Async & data hooks:** useFetch, useDebounce and useThrottle.

@intentui – [https://intentui.com](https://intentui.com)
--------------------------------------------------------

An **accessible React component library** to copy, customise and own your UI[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40intentui). Categories:

* **Inputs & forms:** text fields, selects and checkboxes.

* **Navigation & layout:** tabs, accordions and menus.

* **Feedback components:** alerts, notifications and skeletons.

* **Accessibility helpers:** high‑contrast and keyboard‑friendly designs.

@kibo‑ui – [https://www.kibo-ui.com](https://www.kibo-ui.com)
-------------------------------------------------------------

A **custom registry of composable, accessible, open‑source components**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40kibo). Categories:

* **Composable primitives:** buttons, cards, lists and icons.

* **Application patterns:** navigation bars, footers and settings pages.

* **Accessibility utilities:** focus management and ARIA helpers.

@kanpeki – [https://kanpeki.vercel.app](https://kanpeki.vercel.app)
-------------------------------------------------------------------

A set of **perfect‑designed components** built on **React Aria** and **Motion**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40kanpeki). Categories:

* **Aria‑compliant primitives:** buttons, modals and dropdowns with built‑in accessibility.

* **Motion effects:** animated transitions and interactive states.

* **Templates:** simple layouts and pages using these primitives.

@kokonutui – [https://kokonutui.com](https://kokonutui.com)
-----------------------------------------------------------

A collection of **stunning components built with Tailwind CSS, shadcn/ui and Motion**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40kokonutui). Categories:

* **Interactive cards & lists:** components with hover effects and subtle motion.

* **Landing page sections:** hero banners, testimonials and pricing tables.

* **Animated buttons & icons:** playful interactions using Motion.

@lens‑blocks – [https://lensblocks.com](https://lensblocks.com)
---------------------------------------------------------------

Provides **social media components for the Lens Social Protocol**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40lens). Categories:

* **Profile & feed components:** profile cards, post feeds and comment boxes.

* **Engagement buttons:** like, comment, share and follow buttons.

* **Social wallet integration:** connect to Lens Protocol for posting and following.

@limeplay – [https://limeplay.winoffrg.dev](https://limeplay.winoffrg.dev)
--------------------------------------------------------------------------

A **UI library for building media players in React**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40limeplay). Categories:

* **Media player controls:** play/pause buttons, scrubbers, volume sliders and fullscreen toggles.

* **Playlist components:** lists of tracks or videos with active state.

* **Skins & themes:** light/dark modes and custom styling.

@lucide‑animated – [https://lucide-animated.com](https://lucide-animated.com)
-----------------------------------------------------------------------------

An **open‑source collection of animated Lucide icons**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40lucide). Categories:

* **Animated icons:** common UI icons (arrows, checkmarks, notifications) with animation.

* **Icon sets:** grouped by category (navigation, media, system, social).

@lytenyte – [https://www.1771technologies.com](https://www.1771technologies.com)
--------------------------------------------------------------------------------

Provides **LyteNyte Grid**, a high‑performance, headless React data grid[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40lytenyte). Categories:

* **Data table:** sortable, filterable, virtualised grid with custom cells.

* **Themed grid:** Tailwind & shadcn‑styled table variants.

* **Data utilities:** pagination, selection and in‑cell editing.

@magicui – [https://magicui.design](https://magicui.design)
-----------------------------------------------------------

A **UI library for design engineers** featuring **150+ free and open‑source animated components and effects**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40magicui). Categories:

* **Motion primitives:** buttons, switches and sliders with animations.

* **Text & graphic effects:** headings with reveal animations, animated gradients and glitch effects.

* **Layout sections:** hero banners, pricing tables, feature lists and footers with entrance animations.

* **Utility hooks:** controlling motion preferences and responsiveness.

@mui‑treasury – [https://www.mui-treasury.com](https://www.mui-treasury.com)
----------------------------------------------------------------------------

Offers **hand‑crafted interfaces built on top of MUI components**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40mui). Categories:

* **Navigation patterns:** sidebars, headers and drawers.

* **Data display:** tables, lists and cards.

* **Form controls:** inputs, selects and toggles.

* **Theming:** cohesive color schemes and typography settings.

@moleculeui – [https://www.moleculeui.design](https://www.moleculeui.design)
----------------------------------------------------------------------------

A **modern React component library focused on intuitive interactions and seamless user experiences**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40moleculeui). Categories:

* **Interactive primitives:** buttons, cards and tooltips with built‑in interactions.

* **Navigation:** menus, tabs and breadcrumbs.

* **Modals & overlays:** dialogs, drawers and popovers.

@motion‑primitives – [https://www.motion-primitives.com](https://www.motion-primitives.com)
-------------------------------------------------------------------------------------------

Provides **beautifully designed motion components**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40motion). Categories:

* **Animated buttons & toggles:** micro‑interaction focused buttons.

* **Motion containers:** slides, fades, reveals and parallax effects.

* **Scene transitions:** page transitions and reveal animations.

@ncdai – [https://chanhdai.com](https://chanhdai.com)
-----------------------------------------------------

A **collection of reusable components**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40ncdai). Categories:

* **UI primitives:** buttons, inputs and selects.

* **Layout utilities:** grid and flexbox helpers.

* **Feedback components:** alerts and notifications.

@nuqs – [https://nuqs.dev](https://nuqs.dev)
--------------------------------------------

Offers **custom parsers, adapters and utilities for type‑safe URL state management**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40nuqs). Categories:

* **URL parsers:** decode query parameters into typed objects.

* **Adapters:** integrate URL state with React routers.

* **Utilities:** helpers for serialising and updating URL state.

@nexus‑elements – [https://elements.nexus.availproject.org](https://elements.nexus.availproject.org)
----------------------------------------------------------------------------------------------------

Provides **ready‑made React components for almost any use case**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40nexus). Categories:

* **UI primitives:** buttons, cards, tables and forms.

* **Layout & sections:** hero sections, pricing tables and dashboards.

* **Data visualisation:** charts and progress widgets.

@oui – [https://oui.mw10013.workers.dev](https://oui.mw10013.workers.dev)
-------------------------------------------------------------------------

Distributes **React Aria components with shadcn characteristics**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40oui). Categories:

* **Aria‑compliant primitives:** accessible buttons, menus and dialogs.

* **Shadcn styling:** components styled to fit within shadcn/ui design.

* **Copy‑paste ready:** ready to integrate with minimal configuration.

@paceui – [https://ui.paceui.com](https://ui.paceui.com)
--------------------------------------------------------

Offers **animated components and building blocks built for smooth interaction and rich detail**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40paceui). Categories:

* **Animated cards & lists:** motion‑driven content blocks.

* **Interaction components:** tooltips, modals and dropdown menus with animations.

* **Layout sections:** hero, pricing, features and testimonials.

@paykit‑sdk – [https://www.usepaykit.dev](https://www.usepaykit.dev)
--------------------------------------------------------------------

A **payments SDK** offering unified checkout and billing across multiple gateways[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40paykit). Categories:

* **Checkout flows:** single integration for Stripe, PayPal, Adyen and other gateways.

* **Billing dashboards:** subscription management and invoice components.

* **Webhooks utilities:** components to manage and display webhook events.

@plate – [https://platejs.org](https://platejs.org)
---------------------------------------------------

An **AI‑powered rich text editor for React**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40plate). Categories:

* **Rich text editing:** toolbars, formatting buttons and content area.

* **AI assistance:** summarisation and rewriting suggestions using AI.

* **Plugins:** support for code blocks, tables and media embeds.

@prompt‑kit – [https://www.prompt-kit.com](https://www.prompt-kit.com)
----------------------------------------------------------------------

Provides **core building blocks for AI apps**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40prompt). Categories:

* **Prompt builders:** forms and editors to craft prompts for LLMs.

* **Conversational UI:** chat boxes and session management.

* **AI tools:** modular panels for summarisation, translation and analysis.

@prosekit – [https://prosekit.dev](https://prosekit.dev)
--------------------------------------------------------

A **powerful and flexible rich text editor** for multiple frameworks[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40prosekit). Categories:

* **Rich text core:** editable content area with formatting and styling.

* **Plugins:** mentions, emojis, tables and collaborative editing.

* **Cross‑framework support:** React, Vue, Svelte and more.

@phucbm – [https://ui.phucbm.com](https://ui.phucbm.com)
--------------------------------------------------------

A collection of **modern React UI components with GSAP animations**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40phucbm). Categories:

* **Animated buttons and cards:** motion‑rich components using GSAP.

* **Hero sections:** animated headlines and call‑to‑action panels.

* **Interactive lists:** hover effects and transitions.

@react‑bits – [https://reactbits.dev](https://reactbits.dev)
------------------------------------------------------------

Offers a **large collection of animated, interactive and fully customizable React components**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40react). Categories:

* **Text & heading animations:** typing effects, text reveals and counters.

* **Background & canvas effects:** particle backgrounds, waves and distortions.

* **Interactive elements:** buttons, sliders and toggles with advanced animations.

@retroui – [https://retroui.dev](https://retroui.dev)
-----------------------------------------------------

A **Neobrutalism‑styled React + TailwindCSS UI library**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40retroui). Categories:

* **Bold components:** buttons, cards and modals with strong outlines and bright colors.

* **Layout blocks:** hero sections, pricing tables and footers in neobrutalistic style.

@reui – [https://reui.io](https://reui.io)
------------------------------------------

An **open‑source collection of UI components and animated effects built with React, TypeScript, Tailwind CSS and Motion**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40reui). Categories:

* **Primitives:** buttons, inputs, tabs and dropdowns.

* **Motion components:** modals, drawers, accordions and carousels.

* **Effects:** background animations, reveals and scrolling effects.

@scrollxui – [https://www.scrollxui.dev](https://www.scrollxui.dev)
-------------------------------------------------------------------

A library of **animated, interactive and customizable user interfaces**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40scrollxui). Categories:

* **Scroll‑based animations:** parallax, reveal and fade on scroll.

* **Interactive components:** cards, lists, navigation and modals with motion.

* **Customizable motion controls:** hooks to control animation timing and easing.

@square‑ui – [https://square.lndev.me](https://square.lndev.me)
---------------------------------------------------------------

A **collection of beautifully crafted open‑source layouts**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40square). Categories:

* **Layout templates:** marketing pages, dashboards and admin panels.

* **Reusable sections:** hero, features, pricing, testimonials and FAQs.

* **Page scaffolding:** header, navigation and footer components.

@systaliko‑ui – [https://systaliko-ui.vercel.app](https://systaliko-ui.vercel.app)
----------------------------------------------------------------------------------

A **UI component library designed for flexibility, customization and scaling across variants**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40systaliko). Categories:

* **Configurable primitives:** inputs, buttons, cards and lists with variant props.

* **Responsive layouts:** grids, flex containers and stack components.

* **Theming:** support for multiple themes and design tokens.

@roiui – [https://roiui.com](https://roiui.com)
-----------------------------------------------

Offers **UI components and blocks built with Base UI primitives**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40roiui). Categories:

* **Components:** inputs, buttons, dialogs and tabs using Base UI foundations.

* **Blocks:** complex sections such as forms, dashboards and pricing tables.

* **Motion variants:** some blocks include framer‑motion animations.

@solaceui – [https://www.solaceui.com](https://www.solaceui.com)
----------------------------------------------------------------

Provides **production‑ready sections, animated components and full‑page templates for Next.js, Tailwind CSS and Motion**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40solaceui). Categories:

* **Sections:** hero, features, pricing, testimonials and blog layouts.

* **Animated components:** scroll animations, reveals and micro‑interactions.

* **Templates:** full landing pages and dashboards.

@shadcnblocks – [https://shadcnblocks.com](https://shadcnblocks.com)
--------------------------------------------------------------------

A registry with **hundreds of extra blocks**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40shadcnblocks). Categories:

* **Marketing blocks:** sections for hero, features, pricing and testimonials.

* **Dashboard blocks:** cards, tables and charts.

* **Utility blocks:** navbars, footers and FAQs.

@shadcndesign – [https://www.shadcndesign.com](https://www.shadcndesign.com)
----------------------------------------------------------------------------

A growing **collection of high‑quality blocks and themes**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40shadcndesign). Categories:

* **Blocks:** landing page sections, call‑to‑action panels and content blocks.

* **Themes:** color schemes and typography presets for shadcn/ui components.

@shadcn‑map – [https://shadcn-map.vercel.app](https://shadcn-map.vercel.app)
----------------------------------------------------------------------------

Provides a **map component built with Leaflet and React Leaflet**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40shadcn). Categories:

* **Interactive map:** map container with zoom, pan and tile layer support.

* **Markers & popups:** components to add markers and popups to the map.

@shadcn‑studio – [https://shadcnstudio.com](https://shadcnstudio.com)
---------------------------------------------------------------------

Offers an **open‑source set of shadcn/ui components, blocks and templates with a theme generator**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40shadcn). Categories:

* **Components:** buttons, inputs, dialogs and tables.

* **Blocks:** hero sections, pricing tables, testimonials and dashboards.

* **Templates:** landing pages and admin panels.

* **Theme generator:** customize colours, typography and spacing.

@shadcn‑editor – [https://shadcn-editor.vercel.app](https://shadcn-editor.vercel.app)
-------------------------------------------------------------------------------------

An **accessible, customizable rich text editor** built with Lexical and shadcn/ui[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40shadcn). Categories:

* **Editor core:** WYSIWYG editing area with text formatting.

* **Toolbar:** formatting buttons, lists, headings and code blocks.

* **Extensions:** support for images, links and embed content.

@shadcnui‑blocks – [https://shadcnui-blocks.com](https://shadcnui-blocks.com)
-----------------------------------------------------------------------------

Provides **premium, production‑ready blocks, components and templates**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40shadcnui). Categories:

* **Premium blocks:** polished hero sections, features, testimonials and footers.

* **Components:** buttons, forms, tables and modals.

* **Templates:** complete page layouts for SaaS and marketing sites.

@shadcraft – [https://shadcraft-free.vercel.app](https://shadcraft-free.vercel.app)
-----------------------------------------------------------------------------------

A collection of **polished shadcn/ui components and marketing blocks**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40shadcraft). Categories:

* **Marketing components:** heroes, features, pricing and testimonials.

* **Interactive blocks:** forms, tabs and accordions with motion.

* **Design standards:** production‑quality styling and accessibility.

@smoothui – [https://smoothui.dev](https://smoothui.dev)
--------------------------------------------------------

A library of **motion components built with React, Framer Motion and TailwindCSS**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40smoothui). Categories:

* **Micro‑interaction components:** buttons, cards and lists with smooth animations.

* **Animated effects:** loaders, transitions and reveals.

* **Motion utilities:** hooks for controlling animation sequences.

@spectrumui – [https://ui.spectrumhq.in](https://ui.spectrumhq.in)
------------------------------------------------------------------

A **modern component library built with shadcn/ui and Tailwind CSS**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40spectrumui). Categories:

* **Primitives:** buttons, inputs, selects and tabs.

* **Responsive layouts:** grid systems and responsive containers.

* **Animated components:** carousels, modals and accordions.

* **High‑quality design:** emphasis on smooth animations and aesthetic consistency.

@supabase – [https://supabase.com](https://supabase.com)
--------------------------------------------------------

Combines **React components and blocks that connect your front‑end to your Supabase back‑end**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=Supabase). Categories:

* **Authentication:** sign‑up/in flows, profile and session management.

* **Database CRUD:** tables and forms that read/write Supabase tables.

* **Storage:** file upload/download components for Supabase storage buckets.

* **Real‑time:** components that subscribe to live updates (e.g., chat, notifications).

* **Admin dashboards:** charts and analytics panels.

@svgl – [https://svgl.app](https://svgl.app)
--------------------------------------------

A **library with SVG logos**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40svgl). Categories:

* **Logo collection:** a curated set of company and project logos in SVG format.

* **Branding components:** components to display and style logos.

@tailark – [https://tailark.com](https://tailark.com)
-----------------------------------------------------

Provides **shadcn blocks designed for building modern marketing websites**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40tailark). Categories:

* **Marketing sections:** hero areas, feature lists, pricing tables and testimonials.

* **Call‑to‑action blocks:** sign‑up prompts and purchase sections.

* **Page layouts:** pre‑built marketing pages.

@taki – [https://taki-ui.com](https://taki-ui.com)
--------------------------------------------------

Offers **beautifully designed, accessible components** built with React Aria and Shadcn tokens[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40taki). Categories:

* **Accessible primitives:** buttons, inputs, toggles and dialogs with full ARIA support.

* **Form and filter controls:** search bars, date pickers and sliders.

* **Responsive layouts:** flexible containers and grid systems.

@tour – [https://onboarding-tour.vercel.app](https://onboarding-tour.vercel.app)
--------------------------------------------------------------------------------

Provides a **component for building onboarding tours**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40tour). Categories:

* **Tour container:** stepper to highlight elements on a page.

* **Tooltip steps:** popover descriptions and navigation controls.

* **Progress indicators:** progress bar or dots indicating tour steps.

@uitripled – [https://ui.tripled.work](https://ui.tripled.work)
---------------------------------------------------------------

An **open‑source collection of production‑ready components and blocks** built with shadcn/ui and Framer Motion[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40uitripled). Categories:

* **UI primitives:** buttons, inputs, selects and tables.

* **Motion components:** modals, notifications and sliders with animations.

* **Blocks:** hero, features, pricing and dashboards.

@utilcn – [https://utilcn.dev](https://utilcn.dev)
--------------------------------------------------

Offers **fullstack registry items** including ChatGPT apps, file uploading/downloading and typed environment variables[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40utilcn). Categories:

* **ChatGPT apps:** chat interfaces connecting to AI models.

* **File utilities:** uploaders and downloaders with progress bars.

* **Env management:** helpers to generate type‑safe environment variables.

@wandry‑ui – [https://ui.wandry.com.ua](https://ui.wandry.com.ua)
-----------------------------------------------------------------

A set of **open‑source, fully controlled React Inertia form elements**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40wandry). Categories:

* **Form primitives:** inputs, selects, toggles and date pickers.

* **Controlled components:** built to integrate with Inertia.js and React form state.

* **Validation & error display:** built‑in error messaging.

@wigggle‑ui – [https://wigggle-ui.vercel.app](https://wigggle-ui.vercel.app)
----------------------------------------------------------------------------

Offers a **beautiful collection of copy‑and‑paste widgets**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40wigggle). Categories:

* **Widgets:** clock, weather, countdowns, and small interactive gadgets.

* **UI snippets:** tooltips, modals, accordions and dropdowns.

* **Design experiments:** playful UI elements and micro‑interactions.

@zippystarter – [https://zippystarter.com](https://zippystarter.com)
--------------------------------------------------------------------

Provides **expertly crafted blocks, components and themes**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40zippystarter). Categories:

* **Landing page blocks:** hero, features, pricing and testimonials.

* **Admin components:** tables, charts and dashboards.

* **Themes:** multiple visual themes for quick styling.

@uicapsule – [https://uicapsule.com](https://uicapsule.com)
-----------------------------------------------------------

A **curated collection of components that spark joy**; features **interactive concepts, design experiments and AI/UI intersections**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40uicapsule). Categories:

* **Experimental UI:** playful buttons, sliders and toggles with unique interactions.

* **AI‑enhanced components:** chat widgets and auto‑complete elements.

* **Artistic effects:** creative animations and 3‑D transformations.

@ui‑layouts – [https://ui-layouts.com](https://ui-layouts.com)
--------------------------------------------------------------

Provides **components, effects, design tools and ready‑made blocks to build modern interfaces**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40ui). Categories:

* **Page layouts:** hero sections, split layouts, grid systems and pricing tables.

* **Effects:** parallax scroll, reveal animations and background effects.

* **Design tools:** spacing guides, typography scales and colour palettes.

* **Ready‑made blocks:** testimonials, FAQs, galleries and call‑to‑action sections.

@tailwind‑builder – [https://tailwindbuilder.ai](https://tailwindbuilder.ai)
----------------------------------------------------------------------------

A collection of **free UI blocks and components** with AI tools to generate **forms, tables and charts**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40tailwind). Categories:

* **Marketing blocks:** hero, features, pricing and call‑to‑action sections.

* **Forms & tables:** ready‑made forms, tables and CRUD components.

* **Charts:** bar, line and pie charts styled with Tailwind.

* **AI code generation:** tools to generate and customise blocks using AI[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40tailwind).

@tailwind‑admin – [https://tailwind-admin.com](https://tailwind-admin.com)
--------------------------------------------------------------------------

Provides **free Tailwind admin dashboard templates, components and UI blocks**[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40tailwind). Categories:

* **Admin dashboards:** pre‑built pages with sidebars, top bars and content areas.

* **Data visualisation:** charts, tables and KPI cards.

* **Forms & filters:** search, filters, date pickers and CRUD forms.

* **Layouts:** responsive panels and grid layouts for admin use‑cases.

* * *

These summaries cover all community registries listed in the **shadcn/ui** directory, noting their URLs and the primary categories of components or blocks they provide. The directory descriptions serve as a reliable source for understanding what each registry offers[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=View%20Model%20Context%20Protocol%20MCP)[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=%40billingsdk)[ui.shadcn.com](https://ui.shadcn.com/docs/directory#:~:text=Supabase).

---
```

docs/Component registry grouping.md
```
## You asked

Registry-Directory-shadcn\_ui.pdf

PDF

What format would work best with grouping these component registries by their main majority focus of what they contain? Something that a user could quickly find components by what they need, for example., if they need ai chatbot components then they could check all of grouped registries that provide those specific types of components. Or if they wanted a button component, then all the registries that have buttons would be grouped, and so forth

---

## ChatGPT Replied

Thought for 53s

Use a tag-driven catalog with two views:

1. a “by focus area” view (registry grouped by main theme)

2. a “by component type” view (registry grouped by specific components like chatbots, buttons, tables, etc.)

The current single long list is hard to scan because it’s essentially flat with only per-item metadata.

Registry-Directory-shadcn\_ui

* * *

### 1\. Data format for each registry (backbone of everything)

Define a normalized object for every registry:

    {
      "name": "Acme AI UI",
      "url": "https://…",
      "description": "AI chat + support components",
      "primary_focus": ["ai-chat", "support"],
      "component_tags": [
        "chatbot",
        "chat-window",
        "message-list",
        "avatar",
        "button",
        "input",
        "textarea"
      ]
    }


Key pieces:

* `primary_focus`: 1–3 high-level themes that describe the majority of what it offers.

* `component_tags`: granular component types it actually contains.

* Everything else (framework, license, etc.) stays as secondary fields if you need them.

* * *

### 2\. Controlled vocabulary

Pick a fixed set of values for each axis.

Examples:

**Primary focus buckets (registry-level):**

* `ai-chat`

* `forms-and-inputs`

* `buttons-and-primitives`

* `dashboards-and-admin`

* `marketing-sections`

* `ecommerce`

* `auth-and-user`

* `data-display-and-tables`

* `navigation`

* `templates-and-layouts`

* `full-design-system`

* `misc-utility`

**Component tags (component-level):**

* `button`, `icon-button`, `link-button`

* `input`, `textarea`, `select`, `datepicker`

* `chatbot`, `chat-window`, `messages-list`, `prompt-box`, `typing-indicator`

* `card`, `modal`, `drawer`, `tabs`, `accordion`

* `table`, `data-grid`, `chart`, `stat-widget`

* `navbar`, `sidebar`, `breadcrumb`

* etc.

Keep this tag list stable and reused across all registries.

* * *

### 3\. View A – “By focus area” groupings

Format as grouped sections.

Example:

    AI & Chatbot

      - Acme AI UI       – Chatbots, support widgets, inbox
      - SupportKit UI    – Chat window, FAQ bot, ticket sidebar

    Buttons & UI Primitives

      - Minimal Primitives – Buttons, inputs, toggles
      - Atomic UI          – Buttons, badges, cards, dropdowns

    Dashboards & Admin

      - SaaS Admin Blocks  – Tables, filters, charts, metrics cards


Implementation detail:

* Sort the sections in a sensible order (AI, Forms, Dashboards, etc.).

* Inside each section, list the registries alphabetically or by “richness” (number of component tags).

This satisfies “majority focus” discovery: user scans section titles first.

* * *

### 4\. View B – “By component type” groupings (what you described)

Invert the index: each component type points to registries that contain it.

Example layout:

    Chatbot components

      - Acme AI UI       – chat-window, messages-list, prompt-box
      - SupportKit UI    – chat-window, canned-replies, ticket-sidebar

    Button components

      - Minimal Primitives – button, icon-button, loading-button
      - Atomic UI          – button, ghost-button, segmented-control
      - Acme AI UI         – primary-button (used in chat UIs)

    Table components

      - SaaS Admin Blocks  – data-table, filter-bar, bulk-actions
      - Atomic UI          – simple-table, sortable-table


Mechanically, this is just grouping all registries where `component_tags` contains `chatbot`, `button`, etc.

* * *

### 5\. Matrix view (fast expert scan, optional but strong)

For power users, add a compact matrix:

Rows = registries
Columns = major component types

    Registry            Chatbot   Buttons   Forms   Tables   Auth
    ----------------------------------------------------------------
    Acme AI UI            ✓         ✓        ✓               -
    Minimal Primitives    -         ✓        ✓       -       -
    SaaS Admin Blocks     -         ✓        ✓       ✓       -
    AuthKit UI            -         ✓        ✓       -       ✓


* A quick scan answers “which registries cover chatbots?” or “which are good all-rounder sets?”.

* * *

### 6\. Minimal rule set to keep it consistent

* Assign at least 1 and at most 3 `primary_focus` values per registry.

* Tag every distinct component family in `component_tags`.

* Generate:

  * Focus-grouped list from `primary_focus`.

  * Component-grouped lists from `component_tags`.

  * Optional matrix from both.

This gives the exact behavior you described: users who need “AI chatbot components” open the AI / chat section or the `chatbot` component group; users who need “button” components open the `button` group and see all registries that contain buttons, regardless of their primary focus.

---

## You asked

Can you generate a SPA that can do this ?

---

## You asked

SKILL.md

File

use this skill

---

## ChatGPT Replied

Thought for 1m 0s

Single-file SPA implementing grouped registry browsing; design guided by the provided frontend skill.

SKILL

Save as `index.html` and open in a browser.

    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Component Registry Explorer</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <!-- Optional: custom font -->
      <!-- <link href="https://fonts.googleapis.com/css2?family=Chivo:wght@300;400;600;700&display=swap" rel="stylesheet"> -->

      <style>
        :root {
          --bg: #05060a;
          --bg-elevated: #0b0d15;
          --bg-soft: #101320;
          --bg-softer: #151827;
          --border-subtle: rgba(255, 255, 255, 0.06);
          --border-strong: rgba(255, 255, 255, 0.2);
          --accent: #ffd95e;
          --accent-soft: rgba(255, 217, 94, 0.15);
          --accent-secondary: #65d4ff;
          --text-main: #f5f5f7;
          --text-muted: #9ea0b6;
          --text-softer: #6a6d84;
          --chip-bg: rgba(255, 255, 255, 0.06);
          --chip-border: rgba(255, 255, 255, 0.12);
          --radius-lg: 16px;
          --radius-md: 12px;
          --radius-pill: 999px;
          --shadow-soft: 0 18px 45px rgba(0, 0, 0, 0.6);
          --shadow-halo: 0 0 0 1px rgba(255, 255, 255, 0.03);
          --transition-fast: 150ms ease-out;
          --transition-med: 220ms ease-out;
        }

        * {
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
        }

        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          background: radial-gradient(circle at top, #151735 0, #05060a 50%, #020308 100%);
          color: var(--text-main);
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Chivo", sans-serif;
        }

        body {
          display: flex;
          align-items: stretch;
          justify-content: center;
          padding: 16px;
        }

        #app {
          width: 100%;
          max-width: 1320px;
          background: radial-gradient(circle at top left, rgba(255, 217, 94, 0.12), transparent 52%),
                      radial-gradient(circle at bottom right, rgba(101, 212, 255, 0.1), transparent 55%),
                      linear-gradient(145deg, #05060a 0, #05060a 40%, #05060a 100%);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 24px 80px rgba(0, 0, 0, 0.85),
            0 0 0 1px rgba(255, 255, 255, 0.02);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* Ambient grid overlay */
        #app::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.4;
          pointer-events: none;
          mix-blend-mode: soft-light;
        }

        /* Noise texture */
        #app::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='noStitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.28'/%3E%3C/svg%3E");
          mix-blend-mode: soft-light;
          opacity: 0.35;
          pointer-events: none;
        }

        .app-inner {
          position: relative;
          z-index: 1;
          padding: 18px 22px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: 100%;
        }

        header.app-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .brand-logo {
          width: 32px;
          height: 32px;
          border-radius: 22px;
          background:
            conic-gradient(from 220deg, #ffd95e, #65d4ff, #8b6cff, #ffd95e);
          padding: 1px;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.14),
            0 12px 30px rgba(0, 0, 0, 0.75);
        }

        .brand-logo-inner {
          width: 100%;
          height: 100%;
          border-radius: inherit;
          background: radial-gradient(circle at 30% 20%, #05060a 0, #05060a 50%, #181b2f 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .brand-title {
          font-size: 17px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .brand-subtitle {
          font-size: 12px;
          color: var(--text-muted);
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .pill-meta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          font-size: 11px;
          border-radius: 999px;
          background: rgba(10, 13, 24, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }

        .pill-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 0 5px rgba(255, 217, 94, 0.18);
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 10px;
          background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.06), transparent 60%),
                      radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.04), transparent 40%),
                      rgba(8, 10, 20, 0.95);
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: var(--shadow-halo);
          width: 260px;
        }

        .search-icon {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: radial-gradient(circle at 25% 25%, #ffd95e, #f7b94a);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
          font-size: 11px;
          font-weight: 700;
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          color: var(--text-main);
          font-size: 13px;
        }

        .search-input::placeholder {
          color: var(--text-muted);
        }

        .tabs {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px;
          border-radius: 999px;
          background: rgba(9, 10, 20, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: var(--shadow-halo);
        }

        .tab {
          position: relative;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 12px;
          padding: 5px 11px;
          border-radius: 999px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: color var(--transition-fast), transform var(--transition-fast);
        }

        .tab span.label {
          text-transform: uppercase;
          letter-spacing: 0.14em;
        }

        .tab span.badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-softer);
        }

        .tab.tab-active {
          color: var(--bg);
          transform: translateY(-1px);
        }

        .tab.tab-active::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, #ffd95e, #65d4ff);
          border-radius: inherit;
          z-index: -1;
          box-shadow:
            0 0 0 1px rgba(0, 0, 0, 0.7),
            0 12px 30px rgba(0, 0, 0, 0.8);
        }

        .tab.tab-active span.badge {
          background: rgba(0, 0, 0, 0.16);
          border-color: rgba(0, 0, 0, 0.4);
          color: rgba(0, 0, 0, 0.75);
        }

        main {
          flex: 1;
          display: grid;
          grid-template-columns: minmax(0, 0.95fr) minmax(0, 2.05fr);
          gap: 14px;
          padding-top: 4px;
          padding-bottom: 6px;
          min-height: 0;
        }

        aside {
          border-radius: 20px;
          background: linear-gradient(150deg, rgba(12, 15, 30, 0.96), rgba(6, 7, 16, 0.96));
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 14px 12px 12px;
          box-shadow: var(--shadow-soft);
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 0;
          position: relative;
          overflow: hidden;
        }

        aside::before {
          content: "";
          position: absolute;
          inset: -40%;
          background: conic-gradient(from 180deg, rgba(255, 217, 94, 0.12), transparent, rgba(101, 212, 255, 0.12), transparent, transparent);
          opacity: 0.25;
          filter: blur(42px);
          pointer-events: none;
        }

        .aside-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 0;
        }

        .aside-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 6px;
        }

        .aside-title {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--text-muted);
        }

        .aside-summary {
          font-size: 11px;
          color: var(--text-softer);
        }

        .pill-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 2px;
        }

        .pill-item {
          font-size: 12px;
          padding: 6px 9px;
          border-radius: var(--radius-pill);
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(5, 7, 16, 0.98);
          color: var(--text-muted);
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          cursor: pointer;
          min-width: 0;
          position: relative;
          overflow: hidden;
          transition:
            background var(--transition-med),
            color var(--transition-fast),
            border-color var(--transition-fast),
            transform var(--transition-fast),
            box-shadow var(--transition-fast);
        }

        .pill-item::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top left, rgba(255, 217, 94, 0.28), transparent 50%);
          opacity: 0;
          transition: opacity var(--transition-med);
          pointer-events: none;
        }

        .pill-item:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.32);
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.85);
        }

        .pill-item:hover::before {
          opacity: 1;
        }

        .pill-item.pill-active {
          border-color: rgba(255, 217, 94, 0.85);
          color: var(--bg);
          background: radial-gradient(circle at 0% 0%, #ffd95e, #f6b24b);
          box-shadow:
            0 0 0 1px rgba(0, 0, 0, 0.5),
            0 16px 42px rgba(0, 0, 0, 0.9);
        }

        .pill-item-label {
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .pill-item-count {
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.26);
          color: rgba(255, 255, 255, 0.86);
        }

        .aside-footer {
          font-size: 11px;
          color: var(--text-softer);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          padding-top: 6px;
          border-top: 1px dashed rgba(255, 255, 255, 0.12);
        }

        .muted-em {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--text-softer);
        }

        .aside-footer span.key {
          padding: 2px 6px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(0, 0, 0, 0.3);
          font-size: 10px;
          color: var(--text-muted);
        }

        section.content {
          border-radius: 20px;
          background: radial-gradient(circle at top, rgba(255, 255, 255, 0.04), transparent 56%),
                      linear-gradient(160deg, rgba(10, 12, 22, 0.96), rgba(4, 5, 12, 0.98));
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 14px 14px 12px;
          box-shadow: var(--shadow-soft);
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .content-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .content-heading {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .content-title {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
        }

        .content-subtitle {
          font-size: 12px;
          color: var(--text-softer);
        }

        .content-metrics {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--text-softer);
        }

        .content-metrics span {
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.35);
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .content-metrics span strong {
          color: var(--accent);
          font-weight: 600;
        }

        .content-body {
          flex: 1;
          min-height: 0;
          border-radius: 14px;
          background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.02), transparent 56%),
                      rgba(6, 7, 16, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 10px 10px 9px;
          overflow: hidden;
          position: relative;
        }

        .scroll-region {
          position: absolute;
          inset: 0;
          padding: 4px 2px 3px 2px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
        }

        .scroll-region::-webkit-scrollbar {
          width: 6px;
        }

        .scroll-region::-webkit-scrollbar-track {
          background: transparent;
        }

        .scroll-region::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.24);
          border-radius: 999px;
        }

        .registry-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 8px;
          align-content: flex-start;
          animation: fadeInUp 240ms ease-out;
        }

        .registry-card {
          border-radius: 13px;
          background: linear-gradient(150deg, rgba(15, 18, 32, 0.98), rgba(6, 7, 14, 0.98));
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 9px 9px 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8);
          position: relative;
          overflow: hidden;
          transition:
            transform var(--transition-med),
            box-shadow var(--transition-med),
            border-color var(--transition-med),
            background var(--transition-med);
        }

        .registry-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top left, rgba(255, 217, 94, 0.22), transparent 60%);
          opacity: 0;
          transition: opacity var(--transition-med);
          pointer-events: none;
        }

        .registry-card:hover {
          transform: translateY(-2px) translateZ(0);
          border-color: rgba(255, 217, 94, 0.85);
          box-shadow:
            0 18px 40px rgba(0, 0, 0, 0.9),
            0 0 0 1px rgba(0, 0, 0, 0.8);
          background: linear-gradient(155deg, rgba(20, 22, 38, 0.98), rgba(7, 9, 16, 0.98));
        }

        .registry-card:hover::before {
          opacity: 1;
        }

        .registry-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 6px;
        }

        .registry-name {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .registry-url {
          font-size: 11px;
          color: var(--accent-secondary);
          text-decoration: none;
          border-bottom: 1px dashed rgba(101, 212, 255, 0.6);
          padding-bottom: 1px;
          align-self: flex-start;
        }

        .registry-url:hover {
          text-decoration: none;
          border-bottom-style: solid;
        }

        .registry-description {
          font-size: 11px;
          color: var(--text-softer);
          line-height: 1.4;
        }

        .chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .chip {
          font-size: 10px;
          padding: 3px 7px;
          border-radius: 999px;
          border: 1px solid var(--chip-border);
          background: var(--chip-bg);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          white-space: nowrap;
        }

        .chip.chip-focus {
          border-color: rgba(255, 217, 94, 0.65);
          color: var(--accent);
          background: rgba(255, 217, 94, 0.08);
        }

        .chip.chip-tag {
          border-style: dashed;
        }

        .chip.chip-compact {
          text-transform: none;
          letter-spacing: 0;
          font-size: 9px;
        }

        .registry-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
          margin-top: 3px;
        }

        .registry-meta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          color: var(--text-softer);
        }

        .registry-meta span {
          padding: 2px 5px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(0, 0, 0, 0.3);
        }

        .tag-row-compact {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          justify-content: flex-end;
        }

        .empty-state {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 10px;
          color: var(--text-softer);
          text-align: center;
          font-size: 12px;
        }

        .empty-state-icon {
          width: 42px;
          height: 42px;
          border-radius: 16px;
          border: 1px dashed rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          margin-bottom: 2px;
        }

        .empty-state strong {
          color: var(--accent);
        }

        /* Component view: list layout */
        .component-group-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: fadeInUp 240ms ease-out;
        }

        .component-group {
          border-radius: 13px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: linear-gradient(145deg, rgba(17, 20, 36, 0.98), rgba(4, 5, 12, 0.98));
          padding: 8px 9px 7px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.85);
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .component-group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        .component-name {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: var(--accent-secondary);
        }

        .component-count {
          font-size: 11px;
          color: var(--text-softer);
        }

        .component-registry-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 6px;
          padding: 4px 0;
          border-top: 1px dashed rgba(255, 255, 255, 0.12);
          font-size: 11px;
        }

        .component-registry-row:first-of-type {
          border-top: none;
          padding-top: 0;
        }

        .component-registry-main {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .component-registry-name {
          font-weight: 500;
        }

        .component-registry-description {
          color: var(--text-softer);
          font-size: 10px;
        }

        .component-registry-meta {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 4px;
        }

        /* Matrix view */
        .matrix-wrapper {
          width: 100%;
          overflow-x: auto;
          padding-bottom: 4px;
          animation: fadeInUp 240ms ease-out;
        }

        table.matrix {
          border-collapse: separate;
          border-spacing: 0;
          min-width: 520px;
          width: 100%;
          font-size: 11px;
          color: var(--text-muted);
          background: rgba(10, 12, 24, 0.98);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.9);
        }

        table.matrix thead {
          background: linear-gradient(135deg, rgba(255, 217, 94, 0.12), rgba(101, 212, 255, 0.1));
        }

        table.matrix th,
        table.matrix td {
          padding: 6px 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          text-align: left;
        }

        table.matrix th:last-child,
        table.matrix td:last-child {
          border-right: none;
        }

        table.matrix thead th {
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 10px;
          color: var(--text-main);
          background: rgba(0, 0, 0, 0.24);
        }

        table.matrix tbody tr:last-child td {
          border-bottom: none;
        }

        table.matrix tbody tr:nth-child(odd) td {
          background: rgba(255, 255, 255, 0.01);
        }

        .matrix-registry-name {
          font-weight: 500;
          color: var(--text-main);
        }

        .matrix-icon {
          font-size: 14px;
          text-align: center;
          color: var(--accent);
        }

        .matrix-empty {
          color: rgba(255, 255, 255, 0.25);
          font-size: 12px;
          text-align: center;
        }

        /* View-specific aside text variations */
        .aside-summary span.em {
          color: var(--accent-secondary);
          font-weight: 500;
        }

        /* Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive */
        @media (max-width: 900px) {
          main {
            grid-template-columns: minmax(0, 1fr);
            grid-auto-rows: auto;
          }
        }

        @media (max-width: 720px) {
          .app-inner {
            padding: 14px;
          }

          header.app-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-right {
            width: 100%;
            justify-content: space-between;
          }

          .search-bar {
            flex: 1;
            width: auto;
          }
        }

        @media (max-width: 520px) {
          body {
            padding: 8px;
          }
          #app {
            border-radius: 20px;
          }
          .brand-title {
            font-size: 15px;
          }
          .brand-subtitle {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div id="app">
        <div class="app-inner">
          <header class="app-header">
            <div class="brand">
              <div class="brand-logo">
                <div class="brand-logo-inner">R</div>
              </div>
              <div class="brand-text">
                <div class="brand-title">Registry Atlas</div>
                <div class="brand-subtitle">Shadcn-Based Component Index</div>
              </div>
            </div>
            <div class="header-right">
              <div class="pill-meta">
                <div class="pill-dot"></div>
                <span>Interactive SPA · Local data only</span>
              </div>
              <div class="search-bar">
                <div class="search-icon">⌕</div>
                <input
                  id="searchInput"
                  type="search"
                  class="search-input"
                  placeholder="Filter by name, focus, or tag"
                />
              </div>
              <div class="tabs" role="tablist">
                <button class="tab tab-active" data-view="focus" role="tab">
                  <span class="label">By Focus</span>
                  <span class="badge">Registry clusters</span>
                </button>
                <button class="tab" data-view="component" role="tab">
                  <span class="label">By Component</span>
                  <span class="badge">Need-based</span>
                </button>
                <button class="tab" data-view="matrix" role="tab">
                  <span class="label">Matrix</span>
                  <span class="badge">Coverage</span>
                </button>
              </div>
            </div>
          </header>

          <main>
            <aside>
              <div class="aside-inner" id="aside"></div>
            </aside>
            <section class="content">
              <div class="content-header" id="contentHeader"></div>
              <div class="content-body">
                <div class="scroll-region" id="contentBody"></div>
              </div>
            </section>
          </main>
        </div>
      </div>

      <script>
        // --- Data model ----------------------------------------------------------

        const REGISTRIES = [
          {
            name: "ChatKit UI",
            url: "https://example.com/chatkit",
            description: "Focused set of AI chat surfaces: support inboxes, chat popovers, assistant consoles.",
            primary_focus: ["ai-chat", "support"],
            component_tags: [
              "chatbot", "chat-window", "message-list", "typing-indicator", "prompt-box",
              "button", "input", "badge", "avatar", "toolbar"
            ],
            framework: "React (shadcn/ui)",
            license: "MIT"
          },
          {
            name: "Minimal Primitives",
            url: "https://example.com/minimal-primitives",
            description: "Button-first primitive collection: buttons, toggles, input scaffolding.",
            primary_focus: ["buttons-and-primitives"],
            component_tags: [
              "button", "icon-button", "loading-button", "toggle", "switch",
              "input", "select", "textarea", "badge"
            ],
            framework: "React (shadcn/ui)",
            license: "MIT"
          },
          {
            name: "SaaS Admin Blocks",
            url: "https://example.com/saas-admin-blocks",
            description: "Composable admin building blocks: data tables, filters, metrics cards.",
            primary_focus: ["dashboards-and-admin", "data-display-and-tables"],
            component_tags: [
              "table", "data-grid", "filter-bar", "badge", "pagination",
              "chart", "stat-widget", "toolbar", "button"
            ],
            framework: "React (shadcn/ui)",
            license: "Commercial"
          },
          {
            name: "AuthKit UI",
            url: "https://example.com/authkit",
            description: "Authentication flows: sign-in, sign-up, magic links, profile menus.",
            primary_focus: ["auth-and-user", "forms-and-inputs"],
            component_tags: [
              "auth-form", "input", "password-input", "button",
              "stepper", "alert", "avatar", "navbar"
            ],
            framework: "React / Next.js",
            license: "MIT"
          },
          {
            name: "Navigation Shelf",
            url: "https://example.com/navigation-shelf",
            description: "Navigation-focused set: sidebars, app shells, breadcrumbs.",
            primary_focus: ["navigation", "templates-and-layouts"],
            component_tags: [
              "sidebar", "navbar", "breadcrumb", "app-shell",
              "tabs", "dropdown", "button"
            ],
            framework: "React",
            license: "MIT"
          },
          {
            name: "Story Sections",
            url: "https://example.com/story-sections",
            description: "Hero sections, grids, and editorial layouts for marketing pages.",
            primary_focus: ["marketing-sections", "templates-and-layouts"],
            component_tags: [
              "hero-section", "feature-grid", "testimonial", "cta-section",
              "button", "badge", "card"
            ],
            framework: "React",
            license: "MIT"
          },
          {
            name: "Commerce Blocks",
            url: "https://example.com/commerce-blocks",
            description: "Product cards, carts, and checkout-ready building blocks.",
            primary_focus: ["ecommerce", "forms-and-inputs"],
            component_tags: [
              "product-card", "price-badge", "cart-drawer", "mini-cart",
              "button", "input", "select", "table"
            ],
            framework: "React / Next.js",
            license: "Commercial"
          },
          {
            name: "Dataview Studio",
            url: "https://example.com/dataview-studio",
            description: "Heavy-duty data views: resizable tables, facets, and filters.",
            primary_focus: ["data-display-and-tables", "dashboards-and-admin"],
            component_tags: [
              "data-grid", "table", "column-resize", "filter-bar",
              "search-input", "tag-input", "badge", "toolbar"
            ],
            framework: "React",
            license: "MIT"
          },
          {
            name: "FormLab",
            url: "https://example.com/formlab",
            description: "Form field recipes, validation states, and multi-step flows.",
            primary_focus: ["forms-and-inputs"],
            component_tags: [
              "input", "textarea", "select", "checkbox", "radio",
              "datepicker", "stepper", "submit-button", "error-message"
            ],
            framework: "React",
            license: "MIT"
          },
          {
            name: "Utility Shelf",
            url: "https://example.com/utility-shelf",
            description: "Miscellaneous utilities: toasts, modals, drawers, and skeletons.",
            primary_focus: ["misc-utility"],
            component_tags: [
              "toast", "modal", "drawer", "skeleton", "spinner",
              "badge", "button"
            ],
            framework: "React",
            license: "MIT"
          }
        ];

        const MATRIX_COLUMNS = [
          "chatbot",
          "button",
          "input",
          "table",
          "auth-form",
          "navbar",
          "hero-section"
        ];

        const STATE = {
          currentView: "focus",          // "focus" | "component" | "matrix"
          selectedFocus: null,           // string | null
          selectedComponent: null,       // string | null
          searchTerm: ""
        };

        const root = {
          aside: document.getElementById("aside"),
          contentHeader: document.getElementById("contentHeader"),
          contentBody: document.getElementById("contentBody"),
          tabs: document.querySelectorAll(".tab"),
          searchInput: document.getElementById("searchInput")
        };

        // --- Helpers ------------------------------------------------------------

        function getUniqueFocuses() {
          const set = new Set();
          REGISTRIES.forEach(r => r.primary_focus.forEach(f => set.add(f)));
          return Array.from(set).sort();
        }

        function getComponentCounts() {
          const map = new Map();
          REGISTRIES.forEach(r => {
            r.component_tags.forEach(tag => {
              map.set(tag, (map.get(tag) || 0) + 1);
            });
          });
          const arr = Array.from(map.entries()).map(([tag, count]) => ({ tag, count }));
          arr.sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return a.tag.localeCompare(b.tag);
          });
          return arr;
        }

        function filterRegistries(registries) {
          if (!STATE.searchTerm.trim()) return registries;
          const q = STATE.searchTerm.trim().toLowerCase();
          return registries.filter(r => {
            const haystack = [
              r.name,
              r.description,
              r.framework,
              r.license,
              ...r.primary_focus,
              ...r.component_tags
            ]
              .join(" ")
              .toLowerCase();
            return haystack.includes(q);
          });
        }

        function focusLabel(focusKey) {
          const map = {
            "ai-chat": "AI & Chatbot",
            "support": "Support UIs",
            "forms-and-inputs": "Forms & Inputs",
            "buttons-and-primitives": "Buttons & Primitives",
            "dashboards-and-admin": "Dashboards & Admin",
            "marketing-sections": "Marketing Sections",
            "ecommerce": "Ecommerce",
            "auth-and-user": "Auth & User",
            "data-display-and-tables": "Data Display & Tables",
            "navigation": "Navigation",
            "templates-and-layouts": "Layouts & Templates",
            "misc-utility": "Utility & Misc"
          };
          return map[focusKey] || focusKey;
        }

        function componentLabel(componentKey) {
          return componentKey.replace(/-/g, " ");
        }

        function capitalize(str) {
          return str.charAt(0).toUpperCase() + str.slice(1);
        }

        function escapeHtml(str) {
          return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        }

        // --- Rendering: Aside ---------------------------------------------------

        function renderAsideFocus() {
          const focuses = getUniqueFocuses();
          if (!STATE.selectedFocus && focuses.length) {
            STATE.selectedFocus = focuses[0];
          }

          const filtered = filterRegistries(REGISTRIES);
          const counts = new Map();
          filtered.forEach(r => {
            r.primary_focus.forEach(f => {
              counts.set(f, (counts.get(f) || 0) + 1);
            });
          });

          const summary =
            `<div class="aside-header">
               <div class="aside-title">Focus clusters</div>
               <div class="aside-summary">
                 Registry groups by dominant <span class="em">use-case</span>.
               </div>
             </div>`;

          const pills = focuses
            .filter(f => counts.get(f) > 0)
            .map(focusKey => {
              const count = counts.get(focusKey) || 0;
              const active = STATE.selectedFocus === focusKey ? " pill-active" : "";
              return `
                <button class="pill-item${active}" data-focus="${focusKey}">
                  <span class="pill-item-label">${escapeHtml(focusLabel(focusKey))}</span>
                  <span class="pill-item-count">${count}</span>
                </button>
              `;
            })
            .join("");

          const footer =
            `<div class="aside-footer">
               <span class="muted-em">Filter by cluster</span>
               <span class="key">Focus → registries</span>
             </div>`;

          root.aside.innerHTML =
            summary +
            `<div class="pill-list">${pills}</div>` +
            footer;
        }

        function renderAsideComponent() {
          const componentCounts = getComponentCounts();
          if (!STATE.selectedComponent && componentCounts.length) {
            STATE.selectedComponent = componentCounts[0].tag;
          }

          const filtered = filterRegistries(REGISTRIES);
          const filteredCounts = new Map();
          filtered.forEach(r => {
            r.component_tags.forEach(tag => {
              filteredCounts.set(tag, (filteredCounts.get(tag) || 0) + 1);
            });
          });

          const summary =
            `<div class="aside-header">
               <div class="aside-title">Component index</div>
               <div class="aside-summary">
                 Choose a <span class="em">component type</span> to see who ships it.
               </div>
             </div>`;

          const pills = componentCounts
            .filter(({ tag }) => filteredCounts.get(tag) > 0)
            .slice(0, 32)
            .map(({ tag }) => {
              const count = filteredCounts.get(tag) || 0;
              const active = STATE.selectedComponent === tag ? " pill-active" : "";
              return `
                <button class="pill-item${active}" data-component="${tag}">
                  <span class="pill-item-label">${escapeHtml(componentLabel(tag))}</span>
                  <span class="pill-item-count">${count}</span>
                </button>
              `;
            })
            .join("");

          const footer =
            `<div class="aside-footer">
               <span class="muted-em">Filter by component</span>
               <span class="key">Component → registries</span>
             </div>`;

          root.aside.innerHTML =
            summary +
            `<div class="pill-list">${pills}</div>` +
            footer;
        }

        function renderAsideMatrix() {
          const filtered = filterRegistries(REGISTRIES);
          const summary =
            `<div class="aside-header">
               <div class="aside-title">Matrix axes</div>
               <div class="aside-summary">
                 Rows: <span class="em">registries</span>. Columns: <span class="em">representative components</span>.
               </div>
             </div>`;

          const registryCount = filtered.length;
          const footer =
            `<div class="aside-footer">
               <span class="muted-em">Coverage overview</span>
               <span class="key">${registryCount} registries · ${MATRIX_COLUMNS.length} columns</span>
             </div>`;

          const chips =
            `<div class="pill-list">
               ${MATRIX_COLUMNS.map(col => `
                 <div class="chip chip-compact chip-tag">
                   ${escapeHtml(componentLabel(col))}
                 </div>
               `).join("")}
             </div>`;

          root.aside.innerHTML = summary + chips + footer;
        }

        // --- Rendering: Content header -----------------------------------------

        function renderContentHeaderFocus() {
          const filtered = filterRegistries(REGISTRIES);
          const registryCount = filtered.length;
          const clusterCount = getUniqueFocuses().length;

          root.contentHeader.innerHTML =
            `<div class="content-heading">
               <div class="content-title">Registries by focus</div>
               <div class="content-subtitle">
                 Browse component registries clustered by dominant product use-case.
               </div>
             </div>
             <div class="content-metrics">
               <span><strong>${registryCount}</strong> registries</span>
               <span><strong>${clusterCount}</strong> focus groups</span>
             </div>`;
        }

        function renderContentHeaderComponent() {
          const filtered = filterRegistries(REGISTRIES);
          const registryCount = filtered.length;
          const componentCount = getComponentCounts().length;

          root.contentHeader.innerHTML =
            `<div class="content-heading">
               <div class="content-title">Registries by component</div>
               <div class="content-subtitle">
                 Start from the component you need; see every registry that ships it.
               </div>
             </div>
             <div class="content-metrics">
               <span><strong>${registryCount}</strong> registries</span>
               <span><strong>${componentCount}</strong> component types</span>
             </div>`;
        }

        function renderContentHeaderMatrix() {
          const filtered = filterRegistries(REGISTRIES);
          const registryCount = filtered.length;

          root.contentHeader.innerHTML =
            `<div class="content-heading">
               <div class="content-title">Coverage matrix</div>
               <div class="content-subtitle">
                 Quick scan of which registries cover core component families.
               </div>
             </div>
             <div class="content-metrics">
               <span><strong>${registryCount}</strong> registries</span>
               <span><strong>${MATRIX_COLUMNS.length}</strong> component columns</span>
             </div>`;
        }

        // --- Rendering: Content body -------------------------------------------

        function renderContentBodyFocus() {
          const filtered = filterRegistries(REGISTRIES);
          if (!filtered.length) {
            root.contentBody.innerHTML =
              `<div class="empty-state">
                 <div class="empty-state-icon">⊘</div>
                 <div>No registries match this filter.</div>
                 <div>Clear the search filter or adjust your focus selection.</div>
               </div>`;
            return;
          }

          const registriesForFocus = STATE.selectedFocus
            ? filtered.filter(r => r.primary_focus.includes(STATE.selectedFocus))
            : filtered;

          if (!registriesForFocus.length) {
            root.contentBody.innerHTML =
              `<div class="empty-state">
                 <div class="empty-state-icon">⊘</div>
                 <div>No registries in this focus cluster after filtering.</div>
                 <div>Try another focus cluster or clear the search filter.</div>
               </div>`;
            return;
          }

          const cards = registriesForFocus.map(r => {
            const focusChips = r.primary_focus
              .map(f => `<span class="chip chip-focus">${escapeHtml(focusLabel(f))}</span>`)
              .join("");
            const tagChips = r.component_tags.slice(0, 5)
              .map(tag => `<span class="chip chip-tag chip-compact">${escapeHtml(componentLabel(tag))}</span>`)
              .join("");
            const extraCount = r.component_tags.length - 5;
            const extraChip = extraCount > 0
              ? `<span class="chip chip-compact chip-tag">+${extraCount} more</span>`
              : "";

            return `
              <article class="registry-card">
                <div class="registry-header">
                  <div>
                    <div class="registry-name">${escapeHtml(r.name)}</div>
                  </div>
                  <a href="${escapeHtml(r.url)}" class="registry-url" target="_blank" rel="noreferrer">
                    Visit
                  </a>
                </div>
                <div class="registry-description">
                  ${escapeHtml(r.description)}
                </div>
                <div class="chip-row">
                  ${focusChips}
                </div>
                <div class="registry-footer">
                  <div class="registry-meta">
                    <span>${escapeHtml(r.framework)}</span>
                    <span>${escapeHtml(r.license)}</span>
                  </div>
                  <div class="tag-row-compact">
                    ${tagChips}${extraChip}
                  </div>
                </div>
              </article>
            `;
          }).join("");

          root.contentBody.innerHTML =
            `<div class="registry-grid">${cards}</div>`;
        }

        function renderContentBodyComponent() {
          const filtered = filterRegistries(REGISTRIES);
          if (!filtered.length) {
            root.contentBody.innerHTML =
              `<div class="empty-state">
                 <div class="empty-state-icon">⊘</div>
                 <div>No registries match this filter.</div>
               </div>`;
            return;
          }

          const selected = STATE.selectedComponent;
          if (!selected) {
            root.contentBody.innerHTML =
              `<div class="empty-state">
                 <div class="empty-state-icon">◎</div>
                 <div>Select a component type in the left panel.</div>
               </div>`;
            return;
          }

          const registriesForComponent = filtered.filter(r =>
            r.component_tags.includes(selected)
          );

          if (!registriesForComponent.length) {
            root.contentBody.innerHTML =
              `<div class="empty-state">
                 <div class="empty-state-icon">⊘</div>
                 <div>No registries currently expose this component after filtering.</div>
               </div>`;
            return;
          }

          const groupsHtml = `
            <div class="component-group-list">
              <div class="component-group">
                <div class="component-group-header">
                  <div class="component-name">${escapeHtml(componentLabel(selected))}</div>
                  <div class="component-count">${registriesForComponent.length} registries</div>
                </div>
                <div class="component-group-body">
                  ${registriesForComponent.map(r => {
                    const focusTags = r.primary_focus
                      .map(f => `<span class="chip chip-focus chip-compact">${escapeHtml(focusLabel(f))}</span>`)
                      .join("");
                    const extraTags = r.component_tags
                      .filter(t => t !== selected)
                      .slice(0, 3)
                      .map(t => `<span class="chip chip-tag chip-compact">${escapeHtml(componentLabel(t))}</span>`)
                      .join("");
                    const extraCount = r.component_tags.length - 1 - 3;
                    const moreChip = extraCount > 0
                      ? `<span class="chip chip-compact chip-tag">+${extraCount} more</span>`
                      : "";

                    return `
                      <div class="component-registry-row">
                        <div class="component-registry-main">
                          <div class="component-registry-name">${escapeHtml(r.name)}</div>
                          <div class="component-registry-description">
                            ${escapeHtml(r.description)}
                          </div>
                        </div>
                        <div class="component-registry-meta">
                          ${focusTags}
                          ${extraTags}
                          ${moreChip}
                        </div>
                      </div>
                    `;
                  }).join("")}
                </div>
              </div>
            </div>
          `;

          root.contentBody.innerHTML = groupsHtml;
        }

        function renderContentBodyMatrix() {
          const filtered = filterRegistries(REGISTRIES);
          if (!filtered.length) {
            root.contentBody.innerHTML =
              `<div class="empty-state">
                 <div class="empty-state-icon">⊘</div>
                 <div>No registries match this filter.</div>
               </div>`;
            return;
          }

          const rows = filtered.map(r => {
            const cells = MATRIX_COLUMNS.map(col => {
              const has = r.component_tags.includes(col);
              const icon = has ? "●" : "";
              const cls = has ? "matrix-icon" : "matrix-empty";
              return `<td class="${cls}">${icon}</td>`;
            }).join("");

            return `
              <tr>
                <td>
                  <div class="matrix-registry-name">${escapeHtml(r.name)}</div>
                </td>
                ${cells}
              </tr>
            `;
          }).join("");

          const headers = MATRIX_COLUMNS.map(col =>
            `<th>${escapeHtml(componentLabel(col))}</th>`
          ).join("");

          root.contentBody.innerHTML =
            `<div class="matrix-wrapper">
               <table class="matrix">
                 <thead>
                   <tr>
                     <th>Registry</th>
                     ${headers}
                   </tr>
                 </thead>
                 <tbody>
                   ${rows}
                 </tbody>
               </table>
             </div>`;
        }

        // --- Master render ------------------------------------------------------

        function render() {
          root.tabs.forEach(tab => {
            const view = tab.getAttribute("data-view");
            tab.classList.toggle("tab-active", view === STATE.currentView);
          });

          if (STATE.currentView === "focus") {
            renderAsideFocus();
            renderContentHeaderFocus();
            renderContentBodyFocus();
          } else if (STATE.currentView === "component") {
            renderAsideComponent();
            renderContentHeaderComponent();
            renderContentBodyComponent();
          } else {
            renderAsideMatrix();
            renderContentHeaderMatrix();
            renderContentBodyMatrix();
          }
        }

        // --- Event wiring -------------------------------------------------------

        root.tabs.forEach(tab => {
          tab.addEventListener("click", () => {
            const view = tab.getAttribute("data-view");
            if (view && view !== STATE.currentView) {
              STATE.currentView = view;
              render();
            }
          });
        });

        root.searchInput.addEventListener("input", e => {
          STATE.searchTerm = e.target.value || "";
          render();
        });

        document.addEventListener("click", e => {
          const focusButton = e.target.closest("[data-focus]");
          if (focusButton) {
            const focusKey = focusButton.getAttribute("data-focus");
            if (focusKey && focusKey !== STATE.selectedFocus) {
              STATE.selectedFocus = focusKey;
              STATE.currentView = "focus";
              render();
            }
            return;
          }

          const componentButton = e.target.closest("[data-component]");
          if (componentButton) {
            const tagKey = componentButton.getAttribute("data-component");
            if (tagKey && tagKey !== STATE.selectedComponent) {
              STATE.selectedComponent = tagKey;
              STATE.currentView = "component";
              render();
            }
          }
        });

        // --- Initial render -----------------------------------------------------

        render();
      </script>
    </body>
    </html>

---

## You asked

generate a description that describes exactly what this SPA is and what it's for and does.

---

## ChatGPT Replied

This SPA is an interactive explorer for shadcn-based component registries. It lets you browse, filter, and cross-reference registries by their primary focus areas and the specific component types they ship, so you can quickly find where to source a given kind of UI building block.

It loads a local catalog of registries and normalizes each one into a consistent model: name, URL, description, primary focus tags (e.g. AI chat, dashboards, navigation) and granular component tags (e.g. chatbot, button, table, navbar). On top of that model it provides three coordinated views:

* “By Focus” view: clusters registries by their dominant use-case (AI & Chatbot, Forms & Inputs, Dashboards & Admin, etc.). Selecting a focus in the left sidebar filters the main panel to only registries whose primary focus includes that cluster, with per-registry chips showing focus labels, tech stack, license, and a preview of available component types.

* “By Component” view: inverts the index so you start from a component type (button, chatbot, table, navbar, etc.) and see every registry that exposes it, along with its other focuses and related components. This answers “who ships X?” for any tagged component.

* “Matrix” view: renders a compact coverage table where rows are registries and columns are representative component families; each cell marks whether that registry includes that component type, giving a fast visual scan of coverage overlap and gaps.

Global search runs across registry names, descriptions, focus tags, component tags, framework, and license, narrowing all views in-place. The UI is fully client-side, uses only local data, and is designed for quick need-based discovery of which registries to pull from when you know either the problem domain (focus) or the exact component you need.

---
```

</source_code>
</current_codebase>
