# Testing Patterns

**Analysis Date:** 2026-05-25

## Test Framework

**Runner:**
- Vitest-style tests are present via imports from `vitest` in `tests/registry-explorer/grouping.test.ts` and `tests/registry-explorer/matrixColumns.test.ts`.
- Vitest is not listed in `package.json` or `pnpm-lock.yaml`, so the runner dependency is not configured in the current manifest.
- Config: Not detected. No `vitest.config.*`, `jest.config.*`, or `playwright.config.*` file exists.

**Assertion Library:**
- Vitest `expect`, imported from `vitest` in `tests/registry-explorer/grouping.test.ts` and `tests/registry-explorer/matrixColumns.test.ts`.

**Run Commands:**
```bash
pnpm build              # Configured production validation: tsc && vite build
Not configured          # Run all tests: package.json has no test script
Not configured          # Watch mode: package.json has no test script
Not configured          # Coverage: package.json has no coverage script
```

## Test File Organization

**Location:**
- Tests live in a top-level `tests/` tree, grouped by feature area: `tests/registry-explorer/`.
- Tests are not co-located with source files.
- Current tests cover pure core logic and configuration from `src/registry-explorer/core/`.

**Naming:**
- Use `*.test.ts` filenames: `tests/registry-explorer/grouping.test.ts` and `tests/registry-explorer/matrixColumns.test.ts`.
- Match test file names to the source module under test: `grouping.test.ts` covers `src/registry-explorer/core/grouping.ts`; `matrixColumns.test.ts` covers `src/registry-explorer/core/matrixColumns.ts`.

**Structure:**
```text
tests/
└── registry-explorer/
    ├── grouping.test.ts        # Pure grouping/filtering/metrics tests
    └── matrixColumns.test.ts   # Matrix column vocabulary/config tests
```

## Test Structure

**Suite Organization:**
```typescript
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
  }
];

describe('grouping', () => {
  describe('filterRegistries', () => {
    it('returns all registries when search is empty', () => {
      expect(filterRegistries(mockRegistries, '')).toEqual(mockRegistries);
    });
  });
});
```

**Patterns:**
- Use nested `describe` blocks by module and exported function: `tests/registry-explorer/grouping.test.ts`.
- Define fixture data once at file scope for shared pure-function tests: `mockRegistries` in `tests/registry-explorer/grouping.test.ts`.
- Prefer direct assertions against returned arrays and scalar counts: `toEqual`, `toHaveLength`, `toBe`, `toBeDefined`, and `toBeGreaterThan`.
- Test controlled-vocabulary consistency by comparing config constants to schema constants: `tests/registry-explorer/matrixColumns.test.ts`.
- Keep tests DOM-free for core logic; current tests do not instantiate `document`, `HTMLElement`, or UI renderers.

## Mocking

**Framework:** Not used

**Patterns:**
```typescript
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
  }
];
```

**What to Mock:**
- Use plain typed fixture objects for pure core tests, as in `tests/registry-explorer/grouping.test.ts`.
- Mock DOM roots only if adding tests for `src/registry-explorer/ui/shell.ts` or renderers in `src/registry-explorer/ui/`; no current DOM mocking pattern exists.

**What NOT to Mock:**
- Do not mock pure functions from `src/registry-explorer/core/grouping.ts`; import and exercise them directly.
- Do not mock controlled vocabularies from `src/registry-explorer/core/registry.schema.ts` when testing matrix configuration; compare against the real `COMPONENT_TAG_VALUES`.
- Do not mock the static dataset for schema/config consistency tests unless the test is specifically about edge-case fixture behavior.

## Fixtures and Factories

**Test Data:**
```typescript
const mockRegistries: Registry[] = [
  {
    name: 'Alpha',
    url: 'http://a',
    description: 'Alpha desc',
    primary_focus: ['ai-chat'],
    component_tags: ['chatbot', 'button']
  },
  {
    name: 'Gamma',
    url: 'http://g',
    description: 'Gamma desc',
    primary_focus: ['misc-utility'],
    component_tags: ['button']
  }
];
```

**Location:**
- Fixtures are inline at the top of each test file.
- No shared fixture directory or factory helpers exist.
- The production static dataset lives in `src/registry-explorer/data/registries.data.ts` and is not imported by current tests.

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
Not configured
```

## Test Types

**Unit Tests:**
- Current tests are unit tests for pure core modules.
- `tests/registry-explorer/grouping.test.ts` covers search filtering, focus grouping, component grouping, matrix row construction, and metrics computation.
- `tests/registry-explorer/matrixColumns.test.ts` covers matrix column validity, non-empty configuration, and presence of PRD-defined key components.

**Integration Tests:**
- Not used.
- No tests cover integration between `src/registry-explorer/entry.ts`, `src/registry-explorer/ui/shell.ts`, DOM roots from `index.html`, and the static dataset in `src/registry-explorer/data/registries.data.ts`.

**E2E Tests:**
- Not used.
- No Playwright, Cypress, or browser automation config exists.

## Common Patterns

**Async Testing:**
```typescript
// Not used in current tests.
// Core tests are synchronous because src/registry-explorer/core/grouping.ts is pure.
it('filters by tag', () => {
  const res = filterRegistries(mockRegistries, 'input');
  expect(res).toHaveLength(1);
  expect(res[0].name).toBe('Beta');
});
```

**Error Testing:**
```typescript
// Not used in current tests.
// Error paths currently live in DOM-oriented modules:
// src/registry-explorer/entry.ts
// src/registry-explorer/ui/shell.ts
```

---

*Testing analysis: 2026-05-25*
