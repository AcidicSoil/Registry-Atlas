import { describe, expect, it } from 'vitest';
import {
  parseRegistryExplorerUrlState,
  serializeRegistryExplorerUrlState,
} from '../../src/registry-explorer/core/urlState';

describe('urlState', () => {
  it('parses Discover facets, sort, and route state without DOM globals', () => {
    const state = parseRegistryExplorerUrlState(new URLSearchParams(
      'view=discover&q=button&category=forms-and-inputs&component=button&source=%40delta&sort=name&registry=%40delta&candidate=%40delta%3Abutton',
    ));

    expect(state).toEqual({
      view: 'discover',
      searchTerm: 'button',
      selectedFacets: [
        { dimension: 'category', value: 'forms-and-inputs', label: 'Forms & Inputs' },
        { dimension: 'component', value: 'button', label: 'Button' },
        { dimension: 'registry', value: '@delta', label: '@delta' },
      ],
      sort: 'name',
      selectedProfileRegistryName: '@delta',
      selectedCandidateId: '@delta:button',
      selectedItemSlug: null,
      compareRegistryNames: [],
      compareComponentKeys: [],
    });
  });

  it('migrates legacy focus, component, and matrix views', () => {
    const focus = parseRegistryExplorerUrlState(new URLSearchParams(
      'view=focus&q=button&focus=marketing-sections',
    ));
    const component = parseRegistryExplorerUrlState(new URLSearchParams(
      'view=component&component=button',
    ));
    const matrix = parseRegistryExplorerUrlState(new URLSearchParams('view=matrix'));

    expect(focus).toMatchObject({
      view: 'discover',
      searchTerm: 'button',
      selectedFacets: [{ dimension: 'category', value: 'marketing', label: 'Marketing' }],
    });
    expect(component).toMatchObject({
      view: 'discover',
      selectedFacets: [{ dimension: 'component', value: 'button', label: 'Button' }],
    });
    expect(matrix).toMatchObject({ view: 'compare' });
  });

  it('deduplicates repeated facet and compare selections in stable order', () => {
    const state = parseRegistryExplorerUrlState(new URLSearchParams(
      'view=compare&category=media&category=media&component=button&component=input&source=%40delta&source=%40delta&compareRegistry=%40alpha&compareRegistry=%40alpha&compareRegistry=%40delta&compareComponent=button&compareComponent=button&compareComponent=table',
    ));

    expect(state.selectedFacets.map(facet => [facet.dimension, facet.value])).toEqual([
      ['category', 'media'],
      ['component', 'button'],
      ['component', 'input'],
      ['registry', '@delta'],
    ]);
    expect(state.compareRegistryNames).toEqual(['@alpha', '@delta']);
    expect(state.compareComponentKeys).toEqual(['button', 'table']);
  });

  it('falls back safely for invalid params and rejects invalid allowlisted values', () => {
    const state = parseRegistryExplorerUrlState(new URLSearchParams(
      'view=javascript%3Aalert(1)&q=%20%20&category=bogus&component=bogus&source=&sort=popular&registry=&candidate=&compareComponent=bogus',
    ));

    expect(state).toEqual({
      view: 'discover',
      searchTerm: '',
      selectedFacets: [],
      sort: 'relevance',
      selectedProfileRegistryName: null,
      selectedCandidateId: null,
      selectedItemSlug: null,
      compareRegistryNames: [],
      compareComponentKeys: [],
    });
  });
  it('serializes state in the documented stable order', () => {
    const params = serializeRegistryExplorerUrlState({
      view: 'compare',
      searchTerm: 'upload dropzone',
      selectedFacets: [
        { dimension: 'category', value: 'forms-and-inputs', label: 'Forms & Inputs' },
        { dimension: 'component', value: 'file-upload', label: 'File Upload' },
        { dimension: 'registry', value: '@better-upload', label: '@better-upload' },
      ],
      sort: 'name',
      selectedProfileRegistryName: '@better-upload',
      selectedCandidateId: '@better-upload:upload-dropzone',
      selectedItemSlug: 'upload-dropzone',
      compareRegistryNames: ['@alpha', '@better-upload'],
      compareComponentKeys: ['button', 'file-upload'],
    });

    expect(params.toString()).toBe(
      'view=compare&q=upload+dropzone&category=forms-and-inputs&component=file-upload&source=%40better-upload&sort=name&registry=%40better-upload&candidate=%40better-upload%3Aupload-dropzone&item=upload-dropzone&compareRegistry=%40alpha&compareRegistry=%40better-upload&compareComponent=button&compareComponent=file-upload',
    );
  });

  it('omits the default relevance sort and preserves decoded names', () => {
    const parsed = parseRegistryExplorerUrlState(new URLSearchParams(
      'view=discover&q=AI+chat%2Fthread&source=%40assistant-ui&sort=relevance',
    ));
    const serialized = serializeRegistryExplorerUrlState(parsed);

    expect(parsed.searchTerm).toBe('AI chat/thread');
    expect(parsed.selectedFacets[0]?.value).toBe('@assistant-ui');
    expect(serialized.has('sort')).toBe(false);
    expect(serialized.get('source')).toBe('@assistant-ui');
  });

  it('parses and serializes internal item routes', () => {
    const parsed = parseRegistryExplorerUrlState(new URLSearchParams(
      'view=item&registry=%40delta&item=code-block',
    ));
    const serialized = serializeRegistryExplorerUrlState(parsed);

    expect(parsed).toMatchObject({
      view: 'item',
      selectedProfileRegistryName: '@delta',
      selectedItemSlug: 'code-block',
    });
    expect(serialized.toString()).toBe('view=item&registry=%40delta&item=code-block');
  });

  it('ignores queue and install-token params during parse and serialize', () => {
    const parsed = parseRegistryExplorerUrlState(new URLSearchParams(
      'view=discover&q=button&queue=%408bitcn%2Fbutton&token=%40bad%2Fitem&install=npx+bad',
    ));
    const serialized = serializeRegistryExplorerUrlState({
      ...parsed,
      installQueue: [{ value: '@8bitcn/button' }],
      queue: '@8bitcn/button',
      install: 'npx bad',
    });

    expect(parsed).not.toHaveProperty('queue');
    expect(serialized.has('queue')).toBe(false);
    expect(serialized.has('token')).toBe(false);
    expect(serialized.has('install')).toBe(false);
    expect(serialized.toString()).toBe('view=discover&q=button');
  });
});
