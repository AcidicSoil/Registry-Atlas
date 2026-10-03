import { describe, expect, it } from 'vitest';
import { normalized21stUrl, planReferenceRoutes, summarizeReferencePage } from '../../scripts/audit-21st-reference.mjs';

const origin = 'https://21st.dev/';

describe('21st.dev route evidence and replay', () => {
  it('normalizes only public 21st.dev routes without inventing or leaking query state', () => {
    expect(normalized21stUrl('/community/components/s/button?search=x#demo', origin))
      .toBe('https://21st.dev/community/components/s/button');
    expect(normalized21stUrl('https://21st.dev/@user/components/accordion/', origin))
      .toBe('https://21st.dev/@user/components/accordion');
    for (const candidate of [
      'http://21st.dev/community/components', 'https://21st.dev.evil.test/x',
      '//evil.test/x', 'javascript:alert(1)', 'https://a:b@21st.dev/x',
      'https://cdn.21st.dev/user/demo.html', 'https://21st.dev/admin',
    ]) expect(normalized21stUrl(candidate, origin)).toBeNull();
  });

  it('discovers observed links, deduplicates them, and resumes without replaying visited pages', () => {
    const queue = [origin, 'https://21st.dev/community/components'];
    const observations = {
      [origin]: { links: [
        { url: '/community/templates' }, { url: '/community/components' },
        { url: 'https://external.test/copy' }, { url: '/community/templates#top' },
      ] },
    };
    const plan = planReferenceRoutes({ queue, observations, maxRoutes: 2 });
    expect(plan.queue).toEqual([...queue, 'https://21st.dev/community/templates']);
    expect(plan.selected).toEqual([queue[1], 'https://21st.dev/community/templates']);
    expect(plan.nextCursor).toBe('https://21st.dev/community/templates');
    expect(planReferenceRoutes({ queue: plan.queue, observations, maxRoutes: 2 }).selected)
      .toEqual(['https://21st.dev/community/components', 'https://21st.dev/community/templates']);
    expect(planReferenceRoutes({ queue: plan.queue, observations, maxRoutes: 2,
      cursor: 'https://21st.dev/community/components' }).selected)
      .toEqual(['https://21st.dev/community/templates']);
    expect(() => planReferenceRoutes({ queue, observations, maxRoutes: 0 })).toThrow();
    expect(() => planReferenceRoutes({ queue, observations, maxRoutes: 2, cursor: origin + 'missing' })).toThrow();
  });

  it('defers fresh failures without counting them as complete and retries after cooldown', () => {
    const failed = 'https://21st.dev/design-bug-bot';
    const next = 'https://21st.dev/community/icons';
    const nowMs = Date.parse('2026-10-03T10:00:00.000Z');
    const input = {
      queue: [origin, failed, next],
      observations: { [origin]: { links: [] } },
      errors: { [failed]: { checkedAt: '2026-10-03T09:50:00.000Z', message: 'Unexpected final route' } },
      maxRoutes: 2, nowMs, retryDelayMs: 3_600_000,
    };
    const plan = planReferenceRoutes(input);
    expect(plan.selected).toEqual([next]);
    expect(plan.deferred).toEqual([failed]);
    expect(plan.complete).toBe(false);
    const retry = planReferenceRoutes({ ...input, nowMs: nowMs + 3_600_001 });
    expect(retry.selected).toEqual([failed, next]);
    expect(retry.deferred).toEqual([]);
    expect(planReferenceRoutes({ ...input, observations: { ...input.observations, [failed]: { links: [] }, [next]: { links: [] } } }).complete).toBe(true);
  });

  it('keeps observed sidebar groups, content labels and controls distinct from invented catalog facts', () => {
    const raw = {
      url: 'https://21st.dev/community/components', title: 'Components | 21st',
      viewport: { width: 1920, height: 1080 },
      sidebarGroups: [{ heading: 'Marketing Blocks', links: [
        { text: 'Heroes 1152', href: '/community/components/s/hero', count: 1152, active: true },
        { text: 'External', href: 'https://outsider.test/', count: 99, active: false },
      ] }],
      controls: [{ kind: 'button', label: 'Filter', expanded: false },
        { kind: 'search', label: 'Search components' }],
      links: [{ text: 'Buttons', href: '/community/components/s/button' },
        { text: 'Outside', href: 'https://outsider.test' }],
    };
    const result = summarizeReferencePage(raw, raw.url, '2026-10-03T12:00:00.000Z');
    expect(result.url).toBe(raw.url);
    expect(result.sidebarGroups[0].heading).toBe('Marketing Blocks');
    expect(result.sidebarGroups[0].links).toEqual([
      { label: 'Heroes 1152', url: 'https://21st.dev/community/components/s/hero', count: 1152, active: true },
    ]);
    expect(result.controls).toContainEqual({ kind: 'button', label: 'Filter', expanded: false });
    expect(result.links).toEqual([{ label: 'Buttons', url: 'https://21st.dev/community/components/s/button' }]);
    expect(result.observedAt).toBe('2026-10-03T12:00:00.000Z');
  });
});
