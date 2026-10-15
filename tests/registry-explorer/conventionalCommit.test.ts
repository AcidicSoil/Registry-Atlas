import { describe, expect, it } from 'vitest';

import { checkCommitSubject } from '../../scripts/check-commit-message.mjs';

describe('future-only conventional commit gate', () => {
  it.each([
    'feat(ui): add source-linked preview cards',
    'fix: correct keyboard focus',
    'docs(standards): refresh rule evidence',
    'refactor(core)!: change catalog identity',
    'test(#123): cover mobile navigation',
  ])('accepts %s', subject => {
    expect(checkCommitSubject(subject)).toBeNull();
  });

  it.each([
    'Fixed the bug.',
    'FEAT: add button',
    'feat: Added button',
    'feat: add button.',
    'bad(scope): thing',
    'feat: ',
  ])('rejects %s', subject => {
    expect(checkCommitSubject(subject)).not.toBeNull();
  });
});
