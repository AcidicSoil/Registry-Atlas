#!/usr/bin/env node
/** Future commits only. Historical shared commits are not rewritten. */
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const COMMIT = /^(?:feat|fix|refactor|docs|test|chore|style|perf|ci|build)(?:\([a-z0-9#/-]+\))?!?: [a-z][^\n]*$/;

export function checkCommitSubject(subject) {
  const text = subject.trim();

  if (!COMMIT.test(text)) return 'Expected a lowercase Conventional Commit type and imperative description';

  if (text.length >= 72) return 'Commit subject must be shorter than 72 characters';

  if (text.endsWith('.')) return 'Commit subject must not end with a period';

  if (/^(?:added|fixed|updated|implemented|created)\b/i.test(text.replace(/^.*?: /, ''))) {
    return 'Use imperative mood in the description';
  }

  return null;
}

export async function checkMessageFile(file) {
  const content = await readFile(file, 'utf8');
  const subject = content.split('\n').find(line => line.trim() && !line.startsWith('#')) ?? '';

  return checkCommitSubject(subject);
}

async function main() {
  const args = process.argv.slice(2);
  let subjects = [];

  if (args[0] === '--range' && args[1]) {
    const output = execFileSync('git', ['log', '--no-merges', '--format=%s', args[1]], { encoding: 'utf8' });

    subjects = output.split('\n').filter(Boolean);
  } else if (args.length === 1) {
    const content = await readFile(args[0], 'utf8');

    subjects = [content.split('\n').find(line => line.trim() && !line.startsWith('#')) ?? ''];
  } else {
    throw new Error('Usage: node scripts/check-commit-message.mjs <message-file> | --range <before..head>');
  }

  const errors = subjects.map(subject => [subject, checkCommitSubject(subject)]).filter(([, error]) => error);

  for (const [subject, error] of errors) console.error('INVALID_COMMIT', subject, error);

  if (errors.length) process.exitCode = 1;
  else console.log('Conventional commit check passed for', subjects.length, 'new commits');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(error => {
    console.error('COMMIT_CHECK_FAILED', error.message);
    process.exitCode = 1;
  });
}
