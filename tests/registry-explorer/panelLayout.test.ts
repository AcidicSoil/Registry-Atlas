import { describe, expect, it } from 'vitest';

import { clampPanelWidth, nextPanelWidth } from '../../src/registry-explorer/ui/appShellPanels';

describe('desktop app-shell panel boundaries', () => {
  it('keeps panel resize inside its accessible width range', () => {
    expect(clampPanelWidth(20)).toBe(190);
    expect(clampPanelWidth(1600)).toBe(440);
    expect(clampPanelWidth(250)).toBe(250);
  });

  it('resizes with keyboard arrows and min/max keys', () => {
    expect(nextPanelWidth(250, 'ArrowRight')).toBe(266);
    expect(nextPanelWidth(250, 'ArrowLeft')).toBe(234);
    expect(nextPanelWidth(250, 'Home')).toBe(190);
    expect(nextPanelWidth(250, 'End')).toBe(440);
    expect(nextPanelWidth(250, 'Enter')).toBe(250);
  });
});
