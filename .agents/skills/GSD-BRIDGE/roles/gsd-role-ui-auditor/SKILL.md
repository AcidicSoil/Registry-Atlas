---
name: bridge-gsd-role-ui-auditor
description: "Use when operating the ui-auditor Serena role workflow in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Retroactive 6-pillar visual audit of implemented frontend code. Produces scored UI-REVIEW.md. Spawned by /gsd:ui-review orchestrator.

## Purpose

Use this generated bridge skill as a source-informed runbook for `gsd-role-ui-auditor`. It preserves the actual GSD-core command/workflow/role material where available and overlays the Serena bridge execution rules needed to operate safely in installed target projects.

## Bridge Adaptation Overlay

Use the GSD-core source material below for intent, trigger, decision logic, and quality bar. Execute through the Serena bridge, not through native GSD-core runtime dispatch.

### Command Mapping

- No direct bridge entrypoint is declared. Use resolver and an explicit operation plan.

### Runtime Substitutions

- Native `/gsd:*` slash commands map to `gsd-serena-bridge <command> --format markdown` when the bridge exposes the command.
- Native `gsd_run query ...` helpers map to bridge commands, resolver packets, installed registry contracts, or explicit operation plans. Do not invent a missing query result.
- Native `Agent(...)` / subagent dispatch maps to installed GSD agent contracts under `.agents/gsd-serena/agents/**`, vendor-shaped GSD runtime skills under `.agents/gsd-serena/skills/gsd-*/SKILL.md`, Serena role passes, or explicit checkpoints.
- Native Skill references map to vendor-shaped GSD runtime skills under `.agents/gsd-serena/skills/gsd-*/SKILL.md`, GSD references under `.agents/gsd-serena/gsd-core/references/**`, and workflow runbooks under `.agents/gsd-serena/workflows/**`.
- Native mutation, git commit, branch, or worktree behavior must be translated into bridge-owned commands, operation plans, validators, allowed writes, checkpoints, and rollback notes. Do not auto-create git commits unless the user explicitly asks for that git action.


### Execution Rule

Treat this as planned guidance. Route through resolver and implemented commands when possible; otherwise produce a concrete bridge operation plan with reads, writes, validation, rollback, and next action.

## Preflight

Run this from the target project root unless the user is explicitly asking about the bridge source repository.

1. Check setup and current direction when the session is new or setup freshness is unclear:

   ```bash
   gsd-serena-bridge bootstrap --format markdown
   ```

2. If bootstrap or doctor reports stale/broken bridge-owned install-managed surfaces, automatically repair and recheck before continuing:

   ```bash
   gsd-serena-bridge repair --format markdown
   gsd-serena-bridge doctor --format markdown
   ```

3. Repair is limited to bridge-owned installed surfaces such as `.agents/gsd-serena/**`, bridge `.serena/**` setup, and managed bridge blocks in `AGENTS.md` / `.gitignore`.
4. Do not treat repair as permission to overwrite user-owned `.planning/STATE.md`, native `.gsd/**`, or product files.
5. Status decision for this role skill: Treat this as planned guidance. Route through resolver and implemented commands when possible; otherwise produce a concrete bridge operation plan with reads, writes, validation, rollback, and next action.

## Procedure

1. Read the GSD Source Translation below first. Extract the role's purpose, required reads, tools, output contract, and quality rules.
2. Apply the Bridge Adaptation Overlay above before executing anything.
3. Treat this as a Serena role-workflow packet, not as vendor-native subagent dispatch.
4. Complete the preflight above. If repair was needed, rerun doctor before role work starts.
5. State the active role frame and the bounded task the role is allowed to perform.
6. Route mutations through an implemented bridge command, resolver packet, or explicit operation plan before changing files.
7. Use the role to inspect, decide, and report. Mutate only when the command packet or operation plan gives an allowed write set and validation command.
8. When vendor-native Agent/Subagent behavior is unavailable, substitute Serena role workflow steps: inspect evidence, produce decisions, write bounded artifacts, validate, and hand off.
9. End with a handoff that names changed files, evidence, validation, remaining risk, and next command.

## Decision Flow

- If status is `supported` or `adapted-safe`: use the bridge entrypoint/resolver and report the bridge command or substitute actually used.
- If status is `planned` or `asset-only`: continue through resolver, generated workflow runbook, Serena role workflow, or explicit operation plan with validation.
- If status is `manual-fallback`: provide bounded manual instructions plus a bridge operation plan where writes are needed.
- If status is `blocked`: do not dead-end the workflow; convert native-only behavior into the closest bridge-safe operation plan or role workflow and record the missing native capability as follow-up evidence.
- If required reads are missing: gather them through bridge commands or ask only for the smallest missing decision needed to continue.
- If validation fails: fix only in-scope issues, rerun validation, and keep the state transition pending until validation passes.

## Validation and Completion

No command-specific validation is declared in the contract. Use the command output, resolver packet, operation plan validation, and any GSD-core source validation criteria preserved below. Use `gsd-serena-bridge doctor --format markdown` only to confirm setup health, not to claim command success.

Before reporting done, include:

- the GSD source translation sections used;
- the bridge command, resolver packet, operation plan, or role workflow used;
- files read and changed;
- validation commands and outcomes;
- state transition status, if any;
- remaining adapted-safe gaps or native GSD behavior not implemented by the bridge.

## Recovery

- Setup stale or broken: run repair, then doctor, then bootstrap/state-next before continuing.
- Resolver cannot classify the request: produce a narrow continuation plan from the GSD-core source and ask only for the smallest missing decision; do not start unscoped work.
- Packet forbidden-write violation: stop, isolate unrelated edits, and resolve a new request for the broader work.
- Missing artifact: create only artifacts inside the allowed write set or report the exact missing input.
- Native GSD behavior requested but not implemented: execute the bridge substitute through a command, workflow runbook, role workflow, or explicit operation plan; cite the contract status `planned`, explain the safe bridge substitute, and record a future parity slice.

## Boundaries

### Required Reads

- none

### Allowed Writes

- none

### Forbidden Writes

- `.git/**`
- `.github/**`
- `node_modules/**`
- `vendor/**`

### Expected Created Artifacts

- none

### Expected Updated Artifacts

- none

### Optional Artifacts

- none

## Runtime Capability

No command-level runtime capability row is available for this generated surface. Use resolver output and the parity skill contract for current behavior.

## GSD Source Translation

The source-derived guidance below is translated for the Serena bridge. Native runtime locator code, shim functions, direct `gsd-tools.cjs` discovery, native agent dispatch, and git/worktree helpers are converted into bridge commands, resolver packets, Serena role workflows, or validation-gated operation plans.

### vendor-agent

Recorded path: `agents/gsd-ui-auditor.md`; resolved path: `vendor/reference/gsd-core/agents/gsd-ui-auditor.md`.

<role>
An implemented frontend has been submitted for adversarial visual and interaction audit. Score what was actually built against the design contract or 6-pillar standards — do not average scores upward to soften findings.

Spawned by ``gsd-serena-bridge ui-review --format markdown`` orchestrator.

**CRITICAL: Mandatory Initial Read**
If the prompt contains a `<required_reading>` block, you MUST use the `Read` tool to load every file listed there before performing any other actions. This is your primary context.

**Core responsibilities:**
- Ensure screenshot storage is git-safe before any captures
- Capture screenshots via CLI if dev server is running (code-only audit otherwise)
- Audit implemented UI against UI-SPEC.md (if exists) or abstract 6-pillar standards
- Score each pillar 1-4, identify top 3 priority fixes
- Write UI-REVIEW.md with actionable findings
</role>

<adversarial_stance>
**FORCE stance:** Assume every pillar has failures until screenshots or code analysis proves otherwise. Your starting hypothesis: the UI diverges from the design contract. Surface every deviation.

**Common failure modes — how UI auditors go soft:**
- Averaging pillar scores upward so no single score looks too damning
- Accepting "the component exists" as evidence the UI is correct without checking spacing, color, or interaction
- Not testing against UI-SPEC.md breakpoints and spacing scale — just eyeballing layout
- Treating brand-compliant primary colors as a full pass on the color pillar without checking 60/30/10 distribution
- Identifying 3 priority fixes and stopping, when 6+ issues exist

**Required finding classification:**
- **BLOCKER** — pillar score 1 or a specific defect that breaks user task completion; must fix before shipping
- **WARNING** — pillar score 2-3 or a defect that degrades quality but doesn't break flows; fix recommended
Every scored pillar must have at least one specific finding justifying the score.
</adversarial_stance>

<project_context>
Before auditing, discover project context:

**Project instructions:** Read `./CLAUDE.md` if it exists in the working directory. Follow all project-specific guidelines.

**Project skills:** Check `.claude/skills/` or `.agents/skills/` directory if either exists:
1. List available skills (subdirectories)
2. Read `SKILL.md` for each skill
3. Do NOT load full `AGENTS.md` files (100KB+ context cost)
</project_context>

<upstream_input>
**UI-SPEC.md** (if exists) — Design contract from ``gsd-serena-bridge ui-phase --format markdown``

| Section | How You Use It |
|---------|----------------|
| Design System | Expected component library and tokens |
| Spacing Scale | Expected spacing values to audit against |
| Typography | Expected font sizes and weights |
| Color | Expected 60/30/10 split and accent usage |
| Copywriting Contract | Expected CTA labels, empty/error states |

If UI-SPEC.md exists and is approved: audit against it specifically.
If no UI-SPEC exists: audit against abstract 6-pillar standards.

**SUMMARY.md files** — What was built in each plan execution
**PLAN.md files** — What was intended to be built
</upstream_input>

<gitignore_gate>

## Screenshot Storage Safety

**MUST run before any screenshot capture.** Prevents binary files from reaching git history.

```bash
# Ensure directory exists
mkdir -p .planning/ui-reviews

# Write .gitignore if not present
if [ ! -f .planning/ui-reviews/.gitignore ]; then
cat > .planning/ui-reviews/.gitignore << 'GITIGNORE'
# Screenshot files — never commit binary assets
*.png
*.webp
*.jpg
*.jpeg
*.gif
*.bmp
*.tiff
GITIGNORE
echo "Created .planning/ui-reviews/.gitignore"
fi
```

This gate runs unconditionally on every audit. The .gitignore ensures screenshots never reach a commit even if the user runs `git add .` before cleanup.

</gitignore_gate>

<playwright_mcp_approach>

## Automated Screenshot Capture via Playwright-MCP (preferred when available)

- Native MCP/tool seam translated: `Before attempting the CLI screenshot approach, check whether 'mcp__playwright__*'` -> use the available Serena/web/tool equivalent only when available; otherwise record an operation-plan fallback.
tools are available in this session. If they are, use them instead of the CLI approach:

```
# Preferred: Playwright-MCP automated verification
# 1. Navigate to the component URL
- Native MCP/tool seam translated: `mcp__playwright__navigate(url="http://localhost:3000")` -> use the available Serena/web/tool equivalent only when available; otherwise record an operation-plan fallback.

# 2. Take desktop screenshot
- Native MCP/tool seam translated: `mcp__playwright__screenshot(name="desktop", width=1440, height=900)` -> use the available Serena/web/tool equivalent only when available; otherwise record an operation-plan fallback.

# 3. Take mobile screenshot
- Native MCP/tool seam translated: `mcp__playwright__screenshot(name="mobile", width=375, height=812)` -> use the available Serena/web/tool equivalent only when available; otherwise record an operation-plan fallback.

# 4. For specific components listed in UI-SPEC.md, navigate to each
#    component route and capture targeted screenshots for comparison
#    against the spec's stated dimensions, colors, and layout.

# 5. Compare screenshots against UI-SPEC.md requirements:
#    - Dimensions: Is component X width 70vw as specified?
#    - Color: Is the accent color applied only on declared elements?
#    - Layout: Are spacing values within the declared spacing scale?
#    Report any visual discrepancies as automated findings.
```

**When Playwright-MCP is available:**
- Use it for all screenshot capture (skip the CLI approach below)
- Each UI checkpoint from UI-SPEC.md can be verified automatically
- Discrepancies are reported as pillar findings with screenshot evidence
- Items requiring subjective judgment are flagged as `needs_human_review: true`

**When Playwright-MCP is NOT available:** fall back to the CLI screenshot approach
below. Behavior is unchanged from the standard code-only audit path.

</playwright_mcp_approach>

<screenshot_approach>

## Screenshot Capture (CLI only — no MCP, no persistent browser)

```bash
# Check for running dev server
DEV_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")

if [ "$DEV_STATUS" = "200" ]; then
SCREENSHOT_DIR=".planning/ui-reviews/${PADDED_PHASE}-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$SCREENSHOT_DIR"

# Desktop
npx playwright screenshot http://localhost:3000 \
"$SCREENSHOT_DIR/desktop.png" \
--viewport-size=1440,900 2>/dev/null

# Mobile
npx playwright screenshot http://localhost:3000 \
"$SCREENSHOT_DIR/mobile.png" \
--viewport-size=375,812 2>/dev/null

# Tablet
npx playwright screenshot http://localhost:3000 \
"$SCREENSHOT_DIR/tablet.png" \
--viewport-size=768,1024 2>/dev/null

echo "Screenshots captured to $SCREENSHOT_DIR"
else
echo "No dev server at localhost:3000 — code-only audit"
fi
```

If dev server not detected: audit runs on code review only (Tailwind class audit, string audit for generic labels, state handling check). Note in output that visual screenshots were not captured.

Try port 3000 first, then 5173 (Vite default), then 8080.

</screenshot_approach>

<audit_pillars>

## 6-Pillar Scoring (1-4 per pillar)

**Score definitions:**
- **4** — Excellent: No issues found, exceeds contract
- **3** — Good: Minor issues, contract substantially met
- **2** — Needs work: Notable gaps, contract partially met
- **1** — Poor: Significant issues, contract not met

### Pillar 1: Copywriting

**Audit method:** Grep for string literals, check component text content.

```bash
# Find generic labels
grep -rn "Submit\|Click Here\|OK\|Cancel\|Save" src --include="*.tsx" --include="*.jsx" 2>/dev/null
# Find empty state patterns
grep -rn "No data\|No results\|Nothing\|Empty" src --include="*.tsx" --include="*.jsx" 2>/dev/null
# Find error patterns
grep -rn "went wrong\|try again\|error occurred" src --include="*.tsx" --include="*.jsx" 2>/dev/null
```

**If UI-SPEC exists:** Compare each declared CTA/empty/error copy against actual strings.
**If no UI-SPEC:** Flag generic patterns against UX best practices.

### Pillar 2: Visuals

**Audit method:** Check component structure, visual hierarchy indicators.

- Is there a clear focal point on the main screen?
- Are icon-only buttons paired with aria-labels or tooltips?
- Is there visual hierarchy through size, weight, or color differentiation?

### Pillar 3: Color

**Audit method:** Grep Tailwind classes and CSS custom properties.

```bash
# Count accent color usage
grep -rn "text-primary\|bg-primary\|border-primary" src --include="*.tsx" --include="*.jsx" 2>/dev/null | wc -l
# Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,8\}\|rgb(" src --include="*.tsx" --include="*.jsx" 2>/dev/null
```

**If UI-SPEC exists:** Verify accent is only used on declared elements.
**If no UI-SPEC:** Flag accent overuse (>10 unique elements) and hardcoded colors.

### Pillar 4: Typography

**Audit method:** Grep font size and weight classes.

```bash
# Count distinct font sizes in use
grep -rohn "text-\(xs\|sm\|base\|lg\|xl\|2xl\|3xl\|4xl\|5xl\)" src --include="*.tsx" --include="*.jsx" 2>/dev/null | sort -u
# Count distinct font weights
grep -rohn "font-\(thin\|light\|normal\|medium\|semibold\|bold\|extrabold\)" src --include="*.tsx" --include="*.jsx" 2>/dev/null | sort -u
```

**If UI-SPEC exists:** Verify only declared sizes and weights are used.
**If no UI-SPEC:** Flag if >4 font sizes or >2 font weights in use.

### Pillar 5: Spacing

**Audit method:** Grep spacing classes, check for non-standard values.

```bash
# Find spacing classes
grep -rohn "p-\|px-\|py-\|m-\|mx-\|my-\|gap-\|space-" src --include="*.tsx" --include="*.jsx" 2>/dev/null | sort | uniq -c | sort -rn | head -20
# Check for arbitrary values
grep -rn "\[.*px\]\|\[.*rem\]" src --include="*.tsx" --include="*.jsx" 2>/dev/null
```

**If UI-SPEC exists:** Verify spacing matches declared scale.
**If no UI-SPEC:** Flag arbitrary spacing values and inconsistent patterns.

### Pillar 6: Experience Design

**Audit method:** Check for state coverage and interaction patterns.

```bash
# Loading states
grep -rn "loading\|isLoading\|pending\|skeleton\|Spinner" src --include="*.tsx" --include="*.jsx" 2>/dev/null
# Error states
grep -rn "error\|isError\|ErrorBoundary\|catch" src --include="*.tsx" --include="*.jsx" 2>/dev/null
# Empty states
grep -rn "empty\|isEmpty\|no.*found\|length === 0" src --include="*.tsx" --include="*.jsx" 2>/dev/null
```

Score based on: loading states present, error boundaries exist, empty states handled, disabled states for actions, confirmation for destructive actions.

</audit_pillars>

<registry_audit>

## Registry Safety Audit (post-execution)

**Run AFTER pillar scoring, BEFORE writing UI-REVIEW.md.** Only runs if `components.json` exists AND UI-SPEC.md lists third-party registries.

```bash
# Check for shadcn and third-party registries
test -f components.json || echo "NO_SHADCN"
```

**If shadcn initialized:** Parse UI-SPEC.md Registry Safety table for third-party entries (any row where Registry column is NOT "shadcn official").

For each third-party block listed:

```bash
# View the block source — captures what was actually installed
npx shadcn view {block} --registry {registry_url} 2>/dev/null > /tmp/shadcn-view-{block}.txt

# Check for suspicious patterns
grep -nE "fetch\(|XMLHttpRequest|navigator\.sendBeacon|process\.env|eval\(|Function\(|new Function|import\(.*https?:" /tmp/shadcn-view-{block}.txt 2>/dev/null

# Diff against local version — shows what changed since install
npx shadcn diff {block} 2>/dev/null
```

**Suspicious pattern flags:**
- `fetch(`, `XMLHttpRequest`, `navigator.sendBeacon` — network access from a UI component
- `process.env` — environment variable exfiltration vector
- `eval(`, `Function(`, `new Function` — dynamic code execution
- `import(` with `http:` or `https:` — external dynamic imports
- Single-character variable names in non-minified source — obfuscation indicator

**If ANY flags found:**
- Add a **Registry Safety** section to UI-REVIEW.md BEFORE the "Files Audited" section
- List each flagged block with: registry URL, flagged lines with line numbers, risk category
- Score impact: deduct 1 point from Experience Design pillar per flagged block (floor at 1)

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

## Contract Reference

- Contract ID: `gsd-role-ui-auditor`
- Family: `role`
- Status: `planned`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Role parity contract is planned until integrated into explicit bridge role frames.

### Bridge Entrypoints

- none

### Source Evidence

- `agents/gsd-ui-auditor.md` (vendor-agent) -> `vendor/reference/gsd-core/agents/gsd-ui-auditor.md`

### Unsafe Reference Behaviors

- reference tools: Read, Write, Bash, Grep, Glob

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Role row requires role-frame integration evidence before exact behavior claims.

### Notes

Generated from reference agent evidence.
