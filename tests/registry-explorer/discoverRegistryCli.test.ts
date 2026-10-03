import {describe, expect, it} from 'vitest';
// @ts-ignore Standalone Node ESM CLI parser.
import {parseRegistryScheduleArgs} from '../../scripts/schedule-registry-discovery.mjs';

const required = ['--profile', 'test-profile', '--server', 'http://127.0.0.1:9877',
  '--journal-dir', '/tmp/test-registry-ledgers'];

describe('managed-source discovery scheduler CLI', () => {
  it('requires an explicit managed tab for live work and caps registry batches', () => {
    expect(() => parseRegistryScheduleArgs(required)).toThrow(/tab/);
    const parsed = parseRegistryScheduleArgs([...required, '--tab', 'A'.repeat(32)]);
    expect(parsed).toMatchObject({profile:'test-profile', maxRegistries:2,
      perRegistryLimit:20, delayMs:1000, dryRun:false});
    expect(() => parseRegistryScheduleArgs([...required, '--tab', 'A'.repeat(32),
      '--max-registries', '21'])).toThrow(/max-registries/);
  });

  it('accepts official sitemap survey path only as an absolute directory', () => {
    expect(parseRegistryScheduleArgs([...required,'--dry-run','--sitemap-dir','/tmp/surveys']))
      .toMatchObject({sitemapDir:'/tmp/surveys'});
    expect(()=>parseRegistryScheduleArgs([...required,'--dry-run','--sitemap-dir','relative']))
      .toThrow(/absolute/);
  });
  it('rejects flags without values, duplicate flags and relative journal or report paths', () => {
    expect(() => parseRegistryScheduleArgs([...required, '--dry-run', '--dry-run']))
      .toThrow(/Duplicate/);
    expect(() => parseRegistryScheduleArgs([...required, '--dry-run', '--unknown', 'x']))
      .toThrow(/Unknown/);
    expect(() => parseRegistryScheduleArgs([
      '--profile','p','--server','http://127.0.0.1:9877',
      '--journal-dir','relative/path','--dry-run'])).toThrow(/absolute/);
    expect(() => parseRegistryScheduleArgs([...required, '--dry-run', '--report','report.json']))
      .toThrow(/absolute/);
  });
});
