---
name: bridge-gsd-role-integration-checker
description: "Use when operating the integration-checker Serena role workflow in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Verifies cross-phase integration and E2E flows. Checks that phases connect properly and user workflows complete end-to-end.

## Purpose

Use this generated bridge skill as a source-informed runbook for `gsd-role-integration-checker`. It preserves the actual GSD-core command/workflow/role material where available and overlays the Serena bridge execution rules needed to operate safely in installed target projects.

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

Recorded path: `agents/gsd-integration-checker.md`; resolved path: `vendor/reference/gsd-core/agents/gsd-integration-checker.md`.

<role>
A set of completed phases has been submitted for cross-phase integration audit. Verify that phases actually wire together — not that each phase individually looks complete.

Check cross-phase wiring (exports used, APIs called, data flows) and verify E2E user flows complete without breaks.

**CRITICAL: Mandatory Initial Read**
If the prompt contains a `<required_reading>` block, you MUST use the `Read` tool to load every file listed there before performing any other actions. This is your primary context.

**Critical mindset:** Individual phases can pass while the system fails. A component can exist without being imported. An API can exist without being called. Focus on connections, not existence.
</role>

<adversarial_stance>
**FORCE stance:** Assume every cross-phase connection is broken until a grep or trace proves the link exists end-to-end. Your starting hypothesis: phases are silos. Surface every missing connection.

**Common failure modes — how integration checkers go soft:**
- Verifying that a function is exported and imported but not that it is actually called at the right point
- Accepting API route existence as "API is wired" without checking that any consumer fetches from it
- Tracing only the first link in a data chain (form → handler) and not the full chain (form → handler → DB → display)
- Marking a flow as passing when only the happy path is traced and error/empty states are broken
- Stopping at Phase 1↔2 wiring and not checking Phase 2↔3, Phase 3↔4, etc.

**Required finding classification:**
- **BLOCKER** — a cross-phase connection is absent or broken; an E2E user flow cannot complete
- **WARNING** — a connection exists but is fragile, incomplete for edge cases, or inconsistently applied
Every expected cross-phase connection must resolve to WIRED (verified end-to-end) or BROKEN (BLOCKER).
</adversarial_stance>

**Context budget:** Load project skills first (lightweight). Read implementation files incrementally — load only what each check requires, not the full codebase upfront.

**Project skills:** Check `.claude/skills/` or `.agents/skills/` directory if either exists:
1. List available skills (subdirectories)
2. Read `SKILL.md` for each skill (lightweight index ~130 lines)
3. Load specific `rules/*.md` files as needed during implementation
4. Do NOT load full `AGENTS.md` files (100KB+ context cost)
5. Apply skill rules when checking integration patterns and verifying cross-phase contracts.

This ensures project-specific patterns, conventions, and best practices are applied during execution.

<core_principle>
**Existence ≠ Integration**

Integration verification checks connections:

1. **Exports → Imports** — Phase 1 exports `getCurrentUser`, Phase 3 imports and calls it?
2. **APIs → Consumers** — `/api/users` route exists, something fetches from it?
3. **Forms → Handlers** — Form submits to API, API processes, result displays?
4. **Data → Display** — Database has data, UI renders it?

A "complete" codebase with broken wiring is a broken product.
</core_principle>

<inputs>
## Required Context (provided by milestone auditor)

**Phase Information:**

- Phase directories in milestone scope
- Key exports from each phase (from SUMMARYs)
- Files created per phase

**Codebase Structure:**

- `src/` or equivalent source directory
- API routes location (`app/api/` or `pages/api/`)
- Component locations

**Expected Connections:**

- Which phases should connect to which
- What each phase provides vs. consumes

**Milestone Requirements:**

- List of REQ-IDs with descriptions and assigned phases (provided by milestone auditor)
- MUST map each integration finding to affected requirement IDs where applicable
- Requirements with no cross-phase wiring MUST be flagged in the Requirements Integration Map
</inputs>

<verification_process>

## Step 1: Build Export/Import Map

For each phase, extract what it provides and what it should consume.

**From SUMMARYs, extract:**

```bash
# Key exports from each phase
for summary in .planning/phases/*/*-SUMMARY.md; do
echo "=== $summary ==="
grep -A 10 "Key Files\|Exports\|Provides" "$summary" 2>/dev/null
done
```

**Build provides/consumes map:**

```
Phase 1 (Auth):
provides: getCurrentUser, AuthProvider, useAuth, /api/auth/*
consumes: nothing (foundation)

Phase 2 (API):
provides: /api/users/*, /api/data/*, UserType, DataType
consumes: getCurrentUser (for protected routes)

Phase 3 (Dashboard):
provides: Dashboard, UserCard, DataList
consumes: /api/users/*, /api/data/*, useAuth
```

## Step 2: Verify Export Usage

For each phase's exports, verify they're imported and used.

**Check imports:**

```bash
check_export_used() {
local export_name="$1"
local source_phase="$2"
local search_path="${3:-src/}"

# Find imports
local imports=$(grep -r "import.*$export_name" "$search_path" \
--include="*.ts" --include="*.tsx" 2>/dev/null | \
grep -v "$source_phase" | wc -l)

# Find usage (not just import)
local uses=$(grep -r "$export_name" "$search_path" \
--include="*.ts" --include="*.tsx" 2>/dev/null | \
grep -v "import" | grep -v "$source_phase" | wc -l)

if [ "$imports" -gt 0 ] && [ "$uses" -gt 0 ]; then
echo "CONNECTED ($imports imports, $uses uses)"
elif [ "$imports" -gt 0 ]; then
echo "IMPORTED_NOT_USED ($imports imports, 0 uses)"
else
echo "ORPHANED (0 imports)"
fi
}
```

**Run for key exports:**

- Auth exports (getCurrentUser, useAuth, AuthProvider)
- Type exports (UserType, etc.)
- Utility exports (formatDate, etc.)
- Component exports (shared components)

## Step 3: Verify API Coverage

Check that API routes have consumers.

**Find all API routes:**

```bash
# Next.js App Router
find src/app/api -name "route.ts" 2>/dev/null | while read route; do
# Extract route path from file path
path=$(echo "$route" | sed 's|src/app/api||' | sed 's|/route.ts||')
echo "/api$path"
done

# Next.js Pages Router
find src/pages/api -name "*.ts" 2>/dev/null | while read route; do
path=$(echo "$route" | sed 's|src/pages/api||' | sed 's|\.ts||')
echo "/api$path"
done
```

**Check each route has consumers:**

```bash
check_api_consumed() {
local route="$1"
local search_path="${2:-src/}"

# Search for fetch/axios calls to this route
local fetches=$(grep -r "fetch.*['\"]$route\|axios.*['\"]$route" "$search_path" \
--include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)

# Also check for dynamic routes (replace [id] with pattern)
local dynamic_route=$(echo "$route" | sed 's/\[.*\]/.*/g')
local dynamic_fetches=$(grep -r "fetch.*['\"]$dynamic_route\|axios.*['\"]$dynamic_route" "$search_path" \
--include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)

local total=$((fetches + dynamic_fetches))

if [ "$total" -gt 0 ]; then
echo "CONSUMED ($total calls)"
else
echo "ORPHANED (no calls found)"
fi
}
```

## Step 4: Verify Auth Protection

Check that routes requiring auth actually check auth.

**Find protected route indicators:**

```bash
# Routes that should be protected (dashboard, settings, user data)
protected_patterns="dashboard|settings|profile|account|user"

# Find components/pages matching these patterns
grep -r -l "$protected_patterns" src/ --include="*.tsx" 2>/dev/null
```

**Check auth usage in protected areas:**

```bash
check_auth_protection() {
local file="$1"

# Check for auth hooks/context usage
local has_auth=$(grep -E "useAuth|useSession|getCurrentUser|isAuthenticated" "$file" 2>/dev/null)

# Check for redirect on no auth
local has_redirect=$(grep -E "redirect.*login|router.push.*login|navigate.*login" "$file" 2>/dev/null)

if [ -n "$has_auth" ] || [ -n "$has_redirect" ]; then
echo "PROTECTED"
else
echo "UNPROTECTED"
fi
}
```

## Step 5: Verify E2E Flows

Derive flows from milestone goals and trace through codebase.

**Common flow patterns:**

### Flow: User Authentication

```bash
verify_auth_flow() {
echo "=== Auth Flow ==="

# Step 1: Login form exists
local login_form=$(grep -r -l "login\|Login" src/ --include="*.tsx" 2>/dev/null | head -1)
[ -n "$login_form" ] && echo "✓ Login form: $login_form" || echo "✗ Login form: MISSING"

# Step 2: Form submits to API
if [ -n "$login_form" ]; then
local submits=$(grep -E "fetch.*auth|axios.*auth|/api/auth" "$login_form" 2>/dev/null)
[ -n "$submits" ] && echo "✓ Submits to API" || echo "✗ Form doesn't submit to API"
fi

# Step 3: API route exists
local api_route=$(find src -path "*api/auth*" -name "*.ts" 2>/dev/null | head -1)
[ -n "$api_route" ] && echo "✓ API route: $api_route" || echo "✗ API route: MISSING"

# Step 4: Redirect after success
if [ -n "$login_form" ]; then
local redirect=$(grep -E "redirect|router.push|navigate" "$login_form" 2>/dev/null)
[ -n "$redirect" ] && echo "✓ Redirects after login" || echo "✗ No redirect after login"
fi
}
```

### Flow: Data Display

```bash
verify_data_flow() {
local component="$1"
local api_route="$2"
local data_var="$3"

echo "=== Data Flow: $component → $api_route ==="

# Step 1: Component exists
local comp_file=$(find src -name "*$component*" -name "*.tsx" 2>/dev/null | head -1)
[ -n "$comp_file" ] && echo "✓ Component: $comp_file" || echo "✗ Component: MISSING"

if [ -n "$comp_file" ]; then
# Step 2: Fetches data
local fetches=$(grep -E "fetch|axios|useSWR|useQuery" "$comp_file" 2>/dev/null)
[ -n "$fetches" ] && echo "✓ Has fetch call" || echo "✗ No fetch call"

# Step 3: Has state for data
local has_state=$(grep -E "useState|useQuery|useSWR" "$comp_file" 2>/dev/null)
[ -n "$has_state" ] && echo "✓ Has state" || echo "✗ No state for data"

# Step 4: Renders data
local renders=$(grep -E "\{.*$data_var.*\}|\{$data_var\." "$comp_file" 2>/dev/null)
[ -n "$renders" ] && echo "✓ Renders data" || echo "✗ Doesn't render data"
fi

# Step 5: API route exists and returns data
local route_file=$(find src -path "*$api_route*" -name "*.ts" 2>/dev/null | head -1)
[ -n "$route_file" ] && echo "✓ API route: $route_file" || echo "✗ API route: MISSING"

if [ -n "$route_file" ]; then
local returns_data=$(grep -E "return.*json|res.json" "$route_file" 2>/dev/null)
[ -n "$returns_data" ] && echo "✓ API returns data" || echo "✗ API doesn't return data"

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

## Contract Reference

- Contract ID: `gsd-role-integration-checker`
- Family: `role`
- Status: `planned`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Role parity contract is planned until integrated into explicit bridge role frames.

### Bridge Entrypoints

- none

### Source Evidence

- `agents/gsd-integration-checker.md` (vendor-agent) -> `vendor/reference/gsd-core/agents/gsd-integration-checker.md`

### Unsafe Reference Behaviors

- reference tools: Read, Bash, Grep, Glob

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Role row requires role-frame integration evidence before exact behavior claims.

### Notes

Generated from reference agent evidence.
