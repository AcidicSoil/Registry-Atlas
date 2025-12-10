import { describe, it, expect } from 'vitest';
import {
  filterRegistries,
  buildFocusGroups,
  buildComponentGroups,
  buildMatrixRows,
  computeMetrics
} from '../../src/registry-explorer/core/grouping';
import { Registry } from '../../src/registry-explorer/core/registry.schema';

const mockRegistries: Registry[] = [
  {
    name: 'Alpha',
    url: 'http://a',
    description: 'Alpha desc',
    primary_focus: ['ai-chat'],
    component_tags: ['chatbot', 'button']
  },
  {
    name: 'Beta',
    url: 'http://b',
    description: 'Beta desc',
    primary_focus: ['ai-chat', 'support'],
    component_tags: ['chatbot', 'input']
  },
  {
    name: 'Gamma',
    url: 'http://g',
    description: 'Gamma desc',
    primary_focus: ['misc-utility'],
    component_tags: ['button']
  }
];

describe('grouping', () => {
  describe('filterRegistries', () => {
    it('returns all registries when search is empty', () => {
      expect(filterRegistries(mockRegistries, '')).toEqual(mockRegistries);
      expect(filterRegistries(mockRegistries, '   ')).toEqual(mockRegistries);
    });

    it('filters by name (case insensitive)', () => {
      const res = filterRegistries(mockRegistries, 'alpha');
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe('Alpha');
    });

    it('filters by description', () => {
      const res = filterRegistries(mockRegistries, 'desc');
      expect(res).toHaveLength(3);
    });

    it('filters by tag', () => {
      const res = filterRegistries(mockRegistries, 'input');
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe('Beta');
    });

    it('filters by focus', () => {
      const res = filterRegistries(mockRegistries, 'support');
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe('Beta');
    });

    it('returns empty array when no matches', () => {
      const res = filterRegistries(mockRegistries, 'zeta');
      expect(res).toHaveLength(0);
    });
  });

  describe('buildFocusGroups', () => {
    it('groups registries by focus', () => {
      const groups = buildFocusGroups(mockRegistries, '');
      
      // Expected groups:
      // ai-chat: Alpha, Beta (2)
      // support: Beta (1)
      // misc-utility: Gamma (1)
      
      const aiGroup = groups.find(g => g.focusKey === 'ai-chat');
      expect(aiGroup).toBeDefined();
      expect(aiGroup?.count).toBe(2);
      expect(aiGroup?.registries.map(r => r.name).sort()).toEqual(['Alpha', 'Beta']);

      const supportGroup = groups.find(g => g.focusKey === 'support');
      expect(supportGroup).toBeDefined();
      expect(supportGroup?.count).toBe(1);
      expect(supportGroup?.registries[0].name).toBe('Beta');
    });

    it('sorts groups by count descending', () => {
      const groups = buildFocusGroups(mockRegistries, '');
      expect(groups[0].focusKey).toBe('ai-chat'); // Count 2
    });
  });

  describe('buildComponentGroups', () => {
    it('groups registries by component', () => {
      const groups = buildComponentGroups(mockRegistries, '');
      
      // chatbot: Alpha, Beta (2)
      // button: Alpha, Gamma (2)
      // input: Beta (1)
      
      const chatbotGroup = groups.find(g => g.componentKey === 'chatbot');
      expect(chatbotGroup).toBeDefined();
      expect(chatbotGroup?.count).toBe(2);
      
      const inputGroup = groups.find(g => g.componentKey === 'input');
      expect(inputGroup).toBeDefined();
      expect(inputGroup?.count).toBe(1);
    });
  });

  describe('buildMatrixRows', () => {
    it('builds rows with correct coverage', () => {
      const columns = ['chatbot', 'button', 'input'] as const;
      const rows = buildMatrixRows(mockRegistries, '', columns);
      
      expect(rows).toHaveLength(3);
      
      // Alpha: chatbot(T), button(T), input(F)
      const alphaRow = rows.find(r => r.registry.name === 'Alpha');
      expect(alphaRow?.coverage).toEqual([true, true, false]);
      
      // Beta: chatbot(T), button(F), input(T)
      const betaRow = rows.find(r => r.registry.name === 'Beta');
      expect(betaRow?.coverage).toEqual([true, false, true]);
    });
  });

  describe('computeMetrics', () => {
    it('computes metrics correctly', () => {
      const metrics = computeMetrics(mockRegistries, '');
      expect(metrics.totalRegistries).toBe(3);
      expect(metrics.visibleRegistries).toBe(3);
      expect(metrics.focusGroupCount).toBe(3); // ai-chat, support, misc-utility
      expect(metrics.componentTypeCount).toBe(3); // chatbot, button, input
    });

    it('updates metrics when filtered', () => {
      const metrics = computeMetrics(mockRegistries, 'Alpha');
      expect(metrics.totalRegistries).toBe(3);
      expect(metrics.visibleRegistries).toBe(1);
      expect(metrics.focusGroupCount).toBe(1); // ai-chat
      expect(metrics.componentTypeCount).toBe(2); // chatbot, button
    });
  });
});
