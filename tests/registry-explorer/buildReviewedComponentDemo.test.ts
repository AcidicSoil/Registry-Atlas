import { describe, expect, it } from 'vitest';
// @ts-expect-error Node crypto typings are omitted from the browser test tsconfig.
import { createHash } from 'node:crypto';
// @ts-expect-error This test imports a Node ESM source-build gate without a TS declaration.
import { assessReviewedPreviewCandidate } from '../../scripts/build-reviewed-component-demo.mjs';

const item = {
  namespace: '@example', slug: 'action-button',
  officialUrl: 'https://example.test/r/action-button.json',
  sourceJson: {
    name: 'action-button', type: 'registry:ui',
    files: [{ path: 'registry/action-button.tsx', content: 'export function Button(){ return null }' }],
    dependencies: ['react@19.2.7'],
  },
  reviewed: {
    docsUrl: 'https://example.test/docs/components/action-button',
    registryItemUrl: 'https://example.test/r/action-button.json',
    expectedSha256: null,
    license: { decision: 'approved', identifier: 'MIT', reviewer: 'maintainer' },
    dependencyLock: { 'react': '19.2.7' },
    demoComposition: 'reviewed-fixtures/action-button.tsx',
  },
};

describe('pre-build review gate', () => {
  it('returns build eligibility only for exact reviewed source bytes', () => {
    const approved: any = structuredClone(item);
    approved.officialRawBytes = JSON.stringify(approved.sourceJson);
    approved.reviewed.expectedSha256 = createHash('sha256')
      .update(approved.officialRawBytes).digest('hex');
    expect(assessReviewedPreviewCandidate(approved)).toMatchObject({
      status: 'eligible-for-restricted-build',
      sourceSha256: approved.reviewed.expectedSha256,
    });
    approved.officialRawBytes += ' ';
    expect(assessReviewedPreviewCandidate(approved).reason).toBe('source-hash-mismatch');
  });
  it('rejects private or local official source addresses even with matching reviews', () => {
    const local: any = structuredClone(item);
    local.officialUrl = 'https://127.0.0.1/r/action-button.json';
    local.reviewed.registryItemUrl = local.officialUrl;
    expect(assessReviewedPreviewCandidate(local).reason).toBe('source-url-not-public');
    local.officialUrl = 'https://[::ffff:127.0.0.1]/r/action-button.json';
    local.reviewed.registryItemUrl = local.officialUrl;
    expect(assessReviewedPreviewCandidate(local).reason).toBe('source-url-not-public');
  });
  it('rejects unverified source hash rather than claiming a build', () => {
    expect(assessReviewedPreviewCandidate(item)).toMatchObject({
      status: 'blocked', reason: 'unverified-source-hash',
    });
  });
  it('does not accept a missing license review or unspecified dependency', () => {
    const noLicense = structuredClone(item);
    noLicense.reviewed.license.decision = 'unreviewed';
    expect(assessReviewedPreviewCandidate(noLicense).reason).toBe('license-not-approved');
    const unpinned = structuredClone(item);
    unpinned.sourceJson.dependencies = ['unknown-library'];
    expect(assessReviewedPreviewCandidate(unpinned).reason).toBe('dependency-not-pinned');
  });
  it('rejects source URL mismatches and missing demo composition', () => {
    const wrongOrigin = structuredClone(item);
    wrongOrigin.reviewed.registryItemUrl = 'https://other.test/r/action-button.json';
    expect(assessReviewedPreviewCandidate(wrongOrigin).reason).toBe('source-url-mismatch');
    const noDemo = structuredClone(item);
    noDemo.reviewed.demoComposition = '';
    expect(assessReviewedPreviewCandidate(noDemo).reason).toBe('missing-reviewed-demo-composition');
  });
});
