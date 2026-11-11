import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseSetupDraft,
  SETUP_DRAFT_STORAGE_KEY,
} from "../../src/registry-explorer/core/setupDraft";
import { createShellSetupController } from "../../src/registry-explorer/ui/shellSetup";

describe("shell setup workflow", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("persists the current queue and instructions through the existing setup-draft schema", () => {
    const values = new Map<string, string>();

    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
      sessionStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
      location: { pathname: "/Registry-Atlas/setup" },
    });

    const setup = createShellSetupController({
      getState: () => ({ installQueue: [], setupInstructions: "Review before installing" }),
      setState: vi.fn(),
      navigate: vi.fn(),
      render: vi.fn(),
    });

    expect(setup.readSavedSetup().items).toEqual([]);
    setup.saveSetupDraft();
    expect(parseSetupDraft(values.get(SETUP_DRAFT_STORAGE_KEY) ?? null).instructions).toBe(
      "Review before installing",
    );
  });
});
