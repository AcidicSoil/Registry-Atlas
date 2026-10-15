import { describe, expect, it } from 'vitest';

import { renderInfiniteScrollControl, markAccessibleFeed, type FeedElement } from '../../src/registry-explorer/ui/infiniteScrollControl';

describe('accessible incremental results', () => {
  it('uses a load-more fallback and observer sentinel without numbered pagination', () => {
    const html = renderInfiniteScrollControl(1, 200);

    expect(html).toContain('data-scroll-load-more');
    expect(html).toContain('data-scroll-sentinel');
    expect(html).toContain('Load more');
    expect(html).not.toContain('data-discovery-page');
    expect(html).not.toContain('Page 1');
  });

  it('hides the control on the final result chunk', () => {
    expect(renderInfiniteScrollControl(5, 5)).toBe('');
  });

  it('adds feed position and total semantics to appended cards', () => {
    const attributes: Record<string, string> = {};
    const positions: Array<Record<string, string>> = [{}, {}];

    const list: FeedElement = {
      tagName: 'DIV',
      children: positions.map(record => ({
        setAttribute: (name: string, value: string) => { record[name] = value; },
      })),
      setAttribute: (name: string, value: string) => { attributes[name] = value; },
    };

    markAccessibleFeed(list, 'Showing 1–2 of 76,520');
    expect(attributes.role).toBe('feed');
    expect(attributes['aria-busy']).toBe('false');
    expect(positions.map(record => record['aria-posinset'])).toEqual(['1', '2']);
    expect(positions.map(record => record['aria-setsize'])).toEqual(['76520', '76520']);
    expect(positions.map(record => record.tabindex)).toEqual(['0', '0']);
  });

});
