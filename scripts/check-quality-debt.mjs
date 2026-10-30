#!/usr/bin/env node
/** Block new Knip or Stylelint issues while old findings are remediated. */
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative } from 'node:path';
import stylelint from 'stylelint';

const baselinePath = '.design/quality-debt-baseline.json';

function countInto(counts, key) {
  counts[key] = (counts[key] ?? 0) + 1;
}

export function newIssueCounts(current, baseline) {
  return Object.entries(current).filter(([key, count]) => count > (baseline[key] ?? 0))
    .map(([key, count]) => ({ issue: key, added: count - (baseline[key] ?? 0) }));
}

async function styleIssues() {
  const result = await stylelint.lint({
    files: ['public/styles/**/*.css', 'src/**/*.css'],
    configFile: 'stylelint.config.mjs',
    cache: false,
  });

  const counts = {};

  for (const file of result.results) {
    const source = relative(process.cwd(), file.source ?? '');

    for (const warning of file.warnings) {
      countInto(counts, [source, warning.rule, warning.text.replace(/(?:at line|first used at line) \d+/g, 'at line <line>')].join('|'));
    }

    for (const error of file.parseErrors) countInto(counts, [source, 'parse-error', error.text].join('|'));
  }

  return counts;
}

function knipIssues() {
  const result = spawnSync('pnpm', ['exec', 'knip', '--reporter', 'json'], { encoding: 'utf8' });

  if (result.error) throw result.error;

  if (result.status !== 0 && result.status !== 1) throw Error(result.stderr || 'Knip failed');

  const parsed = JSON.parse(result.stdout);

  if (!Array.isArray(parsed.issues)) throw Error('Knip returned no issue inventory');

  const counts = {};

  for (const file of parsed.issues) {
    for (const [type, symbols] of Object.entries(file)) {
      if (type === 'file' || !Array.isArray(symbols)) continue;

      for (const symbol of symbols) {
        countInto(counts, [file.file, type, symbol.name ?? JSON.stringify(symbol)].join('|'));
      }
    }
  }

  return counts;
}

async function main() {
  const action = process.argv[2] ?? 'all';

  if (!['all', 'styles', 'unused'].includes(action)) throw Error('Unknown audit: ' + action);
  const updated = process.argv.includes('--update-baseline');
  const existing = await readFile(baselinePath, 'utf8').then(JSON.parse, () => ({ schemaVersion: 1 }));
  const selected = action === 'all' ? ['styles', 'unused'] : [action];
  const report = { ...existing, schemaVersion: 1 };

  for (const type of selected) {
    const current = type === 'styles' ? await styleIssues() : knipIssues();

    if (updated) {
      report[type] = current;
      console.log(`BASELINE_UPDATED ${type} issues=${Object.values(current).reduce((a, b) => a + b, 0)}`);
      continue;
    }

    if (!report[type]) throw Error(`Missing ${type} baseline; run explicit --update-baseline`);

    const added = newIssueCounts(current, report[type]);
    const old = Object.values(report[type]).reduce((a, b) => a + b, 0);
    const now = Object.values(current).reduce((a, b) => a + b, 0);

    console.log(`QUALITY_DEBT ${type} previous=${old} current=${now} new=${added.length}`);

    if (added.length) {
      for (const issue of added.slice(0, 15)) console.error('NEW_ISSUE', issue);
      process.exitCode = 1;
    }
  }

  if (updated) {
    await mkdir(dirname(baselinePath), { recursive: true });
    await writeFile(baselinePath, JSON.stringify(report, null, 2) + '\n');
  }
}

if (process.argv[1]?.endsWith('/check-quality-debt.mjs')) {
  await main().catch(error => {
    console.error('QUALITY_DEBT_CHECK_FAILED', error);
    process.exitCode = 2;
  });
}
