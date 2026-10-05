import { describe, expect, it } from 'vitest';
// @ts-ignore Standalone Node ESM script.
import { parseCatalogStructureSurveyArgs } from '../../scripts/survey-registry-catalog-structure.mjs';

describe('catalog structure survey CLI arguments', () => {
  it('allows a full-inventory dry plan without browser arguments', () => {
    expect(parseCatalogStructureSurveyArgs(['--dry-run', '--max-registries', '408'])).toMatchObject({
      dryRun: true,
      maxRegistries: 408,
      maxSurfaces: 4,
      maxLinks: 1500,
      delayMs: 1000,
      useClef: true,
    });
  });

  it('requires the managed browser identity and absolute output directory in live mode', () => {
    expect(() => parseCatalogStructureSurveyArgs([])).toThrow(/--profile/);
    expect(() => parseCatalogStructureSurveyArgs([
      '--profile', 'registry-atlas-source-audit',
      '--server', 'http://127.0.0.1:9877',
      '--tab', 'abc',
      '--output-dir', 'relative/path',
    ])).toThrow(/absolute/i);
  });

  it('parses bounded live options and no-clef mode', () => {
    expect(parseCatalogStructureSurveyArgs([
      '--profile', 'registry-atlas-source-audit',
      '--server', 'http://127.0.0.1:9877',
      '--tab', 'abc',
      '--output-dir', '/tmp/catalog-structure',
      '--cursor', '@kobra',
      '--max-registries', '12',
      '--max-surfaces', '6',
      '--max-links', '2000',
      '--delay-ms', '1500',
      '--decision-url', 'http://127.0.0.1:18080/v1/systemone',
      '--no-clef',
    ])).toEqual({
      profile: 'registry-atlas-source-audit',
      server: 'http://127.0.0.1:9877',
      tab: 'abc',
      outputDir: '/tmp/catalog-structure',
      cursor: '@kobra',
      maxRegistries: 12,
      maxSurfaces: 6,
      maxLinks: 2000,
      delayMs: 1500,
      decisionUrl: 'http://127.0.0.1:18080/v1/systemone',
      dryRun: false,
      useClef: false,
    });
  });

  it('rejects unknown, repeated, or out-of-range arguments', () => {
    expect(() => parseCatalogStructureSurveyArgs(['--wat'])).toThrow(/Unknown/);
    expect(() => parseCatalogStructureSurveyArgs([
      '--dry-run', '--max-registries', '1', '--max-registries', '2',
    ])).toThrow(/repeated/i);
    expect(() => parseCatalogStructureSurveyArgs([
      '--dry-run', '--max-surfaces', '0',
    ])).toThrow(/max-surfaces/);
  });
});
