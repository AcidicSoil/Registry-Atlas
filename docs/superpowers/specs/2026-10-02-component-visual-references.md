# Registry Atlas: official component visual references

**Date:** 2026-10-02
**Status:** Current for evidence-backed visual references and source URLs; **superseded as a final completion standard** by `docs/superpowers/specs/2026-10-03-observed-reference-and-route-parity.md`. The user now also requires working interactive previews and full 21st.dev route/content parity. Images remain useful interim references, but are not interaction-verified component coverage.

## Product contract

The purpose of a component preview is to help people recognize what a component looks like. An image of the **actual example** on the official component page, alongside the correct official page URL, satisfies the requirement. Atlas does not need to install, build, execute, redistribute, or emulate third-party component source code. Open the original page when an interactive inspection is desired.

- Cards show a representative, lazily loaded visual reference when one is recorded. The entire normal card navigates internally to the matching Atlas detail route; a small, separate **View original** action opens the verified official page.
- Detail routes show the same image, not an unrelated banner, with a **View original component** link to the exact observed official component page. The original registry homepage remains in the route header.
- When an image is absent, preserve the catalog card and detail route with a compact factual **Visual reference not yet available** state. Do not substitute an image from an unrelated component or pretend that a generic social preview depicts the component.
- Existing source-informed interactive fixtures are retained as a fallback until matching official images are available. They do not establish a requirement to build new React preview hosts.

## Discovery, capture and publication

1. Reuse `scripts/schedule-registry-discovery.mjs` and `scripts/discover-registry-components.mjs` to discover each website's *observed* navigation and listing links. Different URL patterns are expected; no URL is verified by a slug-to-URL guess. The official source profile is `registry-atlas-source-audit`.
2. The discovery JSONL ledger records exactly matched catalog identity, observed documentation URL, rendered heading, source homepage and catalog fingerprint. Only current `page-observed` records may be considered for capture.
3. `scripts/capture-component-visuals.mjs` runs in the **same managed source browser**. It independently reopens the observed URL, confirms the heading, and clips an actual demo surface. The worker uses reusable demo-container strategies (a titled component frame or an active Preview tab); it never screenshots a random entire page or generically selects the site's `og:image`. Unknown page shapes remain unresolved for later inspection.
4. Publish successful images to `public/data/previews/<registry>/` and their exact catalog identity, local image path, official page URL and capture evidence to `public/data/component-previews.json`. Keep failed capture outcomes in durable user-state JSONL. A failed capture must not publish a broken image.
5. `loadRegistries` accepts validated image references from this manifest, and catalog/detail rendering uses their corresponding official page link. Never treat a raw catalog `preview_url` field as verified visual evidence.

## Managed operator workflow

From the Registry Atlas repository root, with an existing, approved source profile and exact managed tab:

```bash
SOURCE_SERVER="$(pinchtab-profile-manager registry-atlas-source-audit status --json |
  jq -er '[.data.instances[] | select(.status=="running") | .url]
    | if length == 1 then .[0] else error("Expected exactly one running source profile") end')"
SOURCE_TAB='<tab ID from pinchtab --server "$SOURCE_SERVER" tab --json>'
JOURNAL_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/registry-atlas/discovery"
mkdir -p "$JOURNAL_DIR"

# Preview the next bounded discovery batch without browsing.
node scripts/schedule-registry-discovery.mjs \
  --profile registry-atlas-source-audit --server "$SOURCE_SERVER" \
  --journal-dir "$JOURNAL_DIR" --max-registries 2 --dry-run

# Browse selected registries (the scheduler supports exclusive --cursor).
node scripts/schedule-registry-discovery.mjs \
  --profile registry-atlas-source-audit --server "$SOURCE_SERVER" \
  --tab "$SOURCE_TAB" --journal-dir "$JOURNAL_DIR" \
  --max-registries 2 --per-registry-limit 20 --delay-ms 1000

# Inspect and then capture the observed items for an exact registry.
node scripts/capture-component-visuals.mjs \
  --registry @8bitcn --profile registry-atlas-source-audit \
  --server "$SOURCE_SERVER" --tab "$SOURCE_TAB" \
  --journal "$JOURNAL_DIR/8bitcn.jsonl" --limit 10 --dry-run

node scripts/capture-component-visuals.mjs \
  --registry @8bitcn --profile registry-atlas-source-audit \
  --server "$SOURCE_SERVER" --tab "$SOURCE_TAB" \
  --journal "$JOURNAL_DIR/8bitcn.jsonl" --limit 10 --delay-ms 1000
```

To sweep all presently observed, uncaptured visual candidates across registries (rather than naming each registry manually):

```bash
node scripts/schedule-visual-captures.mjs \
  --profile registry-atlas-source-audit --server "$SOURCE_SERVER" \
  --journal-dir "$JOURNAL_DIR" --max-registries 10 \
  --per-registry-limit 10 --dry-run

node scripts/schedule-visual-captures.mjs \
  --profile registry-atlas-source-audit --server "$SOURCE_SERVER" \
  --tab "$SOURCE_TAB" --journal-dir "$JOURNAL_DIR" \
  --max-registries 10 --per-registry-limit 10 --delay-ms 1000
```

The sweep selects only registries with current observed, uncaptured items and emits an exclusive registry-name `nextCursor`. It processes one browser tab serially. Repeat without a cursor to revisit new observations or failed capture families; no unverified catalog URL becomes a visual.

The CLI limits each capture batch to 25 identities and uses per-item manifest checkpoints. Browser navigation stays on the observed official HTTPS origin. Source pages requiring authentication, unrelated external redirects, or demo layouts the selector cannot reliably identify are skipped, not guessed.

## Tested slice and remaining coverage

The first live sources are `@8bitcn/accordion`, `@animate-ui/components-animate-avatar-group`, and `@animate-ui/components-animate-code`: all have observed URLs and targeted captured images. The previous button/card/input and SVG logo image references remain intact. Full catalog discovery and image capture across 408 registries are **not complete**; no upstream-build coverage milestone is needed for this requirement.

Only the navigation/identity portion of `2026-10-01-scalable-registry-discovery.md` continues to govern this visual-reference work. Its upstream code review/build handoff is not an acceptance gate for visual captures. The old source-exact React build-host plan is superseded and should not be pursued to satisfy this product requirement.
