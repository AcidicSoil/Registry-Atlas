import { describe, expect, it } from 'vitest';
import {
  parseRegistryExplorerUrlState,
  serializeRegistryExplorerUrlState,
} from '../../src/registry-explorer/core/urlState';

describe('urlState', () => {
  it('parses valid URL state without DOM globals', () => {
    const state = parseRegistryExplorerUrlState(
      new URLSearchParams('view=focus&q=button&registry=%408bitcn&candidate=%408bitcn%3Abutton&focus=buttons-and-primitives&component=button')
    );

    expect(state).toEqual({
      view: 'focus',
      searchTerm: 'button',
      selectedProfileRegistryName: '@8bitcn',
      selectedCandidateId: '@8bitcn:button',
      selectedFocus: 'buttons-and-primitives',
      selectedComponent: 'button',
      selectedItemSlug: null,
    });
  });

  it('falls back safely for invalid or empty params', () => {
    const state = parseRegistryExplorerUrlState(
      new URLSearchParams('view=javascript%3Aalert(1)&q=%20%20&registry=&candidate=&focus=&component=')
    );

    expect(state).toEqual({
      view: 'discover',
      searchTerm: '',
      selectedProfileRegistryName: null,
      selectedCandidateId: null,
      selectedFocus: null,
      selectedComponent: null,
      selectedItemSlug: null,
    });
  });

  it('serializes state in a stable allowlisted order', () => {
    const params = serializeRegistryExplorerUrlState({
      view: 'component',
      searchTerm: 'upload dropzone',
      selectedProfileRegistryName: '@better-upload',
      selectedCandidateId: '@better-upload:upload-dropzone',
      selectedFocus: 'forms-and-inputs',
      selectedComponent: 'file-upload',
      selectedItemSlug: null,
    });

    expect(params.toString()).toBe(
      'view=component&q=upload+dropzone&registry=%40better-upload&candidate=%40better-upload%3Aupload-dropzone&focus=forms-and-inputs&component=file-upload'
    );
  });

  it('preserves percent-decoded search and registry names containing at signs', () => {
    const parsed = parseRegistryExplorerUrlState(
      new URLSearchParams('view=discover&q=AI+chat%2Fthread&registry=%40assistant-ui')
    );
    const serialized = serializeRegistryExplorerUrlState(parsed);

    expect(parsed.searchTerm).toBe('AI chat/thread');
    expect(parsed.selectedProfileRegistryName).toBe('@assistant-ui');
    expect(serialized.get('registry')).toBe('@assistant-ui');
  });

  it('parses and serializes internal item routes', () => {
    const parsed = parseRegistryExplorerUrlState(
      new URLSearchParams('view=item&registry=%40delta&item=code-block')
    );
    const serialized = serializeRegistryExplorerUrlState(parsed);

    expect(parsed).toEqual({
      view: 'item',
      searchTerm: '',
      selectedProfileRegistryName: '@delta',
      selectedCandidateId: null,
      selectedFocus: null,
      selectedComponent: null,
      selectedItemSlug: 'code-block',
    });
    expect(serialized.toString()).toBe('view=item&registry=%40delta&item=code-block');
  });

  it('ignores queue and install-token params during parse and serialize', () => {
    const parsed = parseRegistryExplorerUrlState(
      new URLSearchParams('view=discover&q=button&queue=%408bitcn%2Fbutton&token=%40bad%2Fitem&install=npx+bad')
    );
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
