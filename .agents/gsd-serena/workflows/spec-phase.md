# Bridge Workflow: spec-phase

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-spec-phase` in a target project.

## Bridge Entry

```bash
gsd-serena-bridge bootstrap --format markdown
gsd-serena-bridge doctor --format markdown
```

If setup is stale or broken, run:

```bash
gsd-serena-bridge repair --format markdown
gsd-serena-bridge doctor --format markdown
```

Primary bridge route:

```text
Use `gsd-serena-bridge resolve --stdin --format markdown` to map this workflow intent to an implemented bridge command or operation plan.
```

For natural-language requests, classify first:

```bash
cat <<'EOF_REQUEST' | gsd-serena-bridge resolve --stdin --format markdown
<verbatim user request>
EOF_REQUEST
```

## Bridge Substitution Rules

- Preserve the GSD-core trigger, purpose, process steps, decision logic, and quality bar from the source workflow below.
- Replace native `/gsd:*` slash commands with `gsd-serena-bridge <command> --format markdown` when implemented.
- Replace native `gsd_run query ...` calls with bridge commands, resolver packets, installed contracts, or explicit operation plans.
- Replace native `Agent(...)` dispatch with Serena role workflows, generated role skills, sequential role passes, or explicit checkpoints.
- Do not run native shell snippets that mutate state unless a bridge command or operation plan authorizes the same write set and validation.
- Do not claim exact native behavior for adapted-safe or planned rows. Name the bridge substitute and remaining gap.

## Source Evidence

- Contract ID: `gsd-workflow-spec-phase`
- Status: `planned`
- Source path: `gsd-core/workflows/spec-phase.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/spec-phase.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/spec-phase.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Clarify WHAT a phase delivers through a Socratic interview loop with quantitative ambiguity scoring.
Produces a SPEC.md with falsifiable requirements that discuss-phase treats as locked decisions.

This workflow handles "what" and "why" — discuss-phase handles "how".
</purpose>

<ambiguity_model>
Score each dimension 0.0 (completely unclear) to 1.0 (crystal clear):

| Dimension         | Weight | Minimum | What it measures                                  |
|-------------------|--------|---------|---------------------------------------------------|
| Goal Clarity      | 35%    | 0.75    | Is the outcome specific and measurable?           |
| Boundary Clarity  | 25%    | 0.70    | What's in scope vs out of scope?                  |
| Constraint Clarity| 20%    | 0.65    | Performance, compatibility, data requirements?    |
| Acceptance Criteria| 20%   | 0.70    | How do we know it's done?                         |

**Ambiguity score** = 1.0 − (0.35×goal + 0.25×boundary + 0.20×constraint + 0.20×acceptance)

**Gate:** ambiguity ≤ 0.20 AND all dimensions ≥ their minimums → ready to write SPEC.md.

A score of 0.20 means 80% weighted clarity — enough precision that the planner won't silently make wrong assumptions.
</ambiguity_model>

<interview_perspectives>
Rotate through these perspectives — each naturally surfaces different blindspots:

**Researcher (rounds 1–2):** Ground the discussion in current reality.
- "What exists in the codebase today related to this phase?"
- "What's the delta between today and the target state?"
- "What triggers this work — what's broken or missing?"

**Simplifier (round 2):** Surface minimum viable scope.
- "What's the simplest version that solves the core problem?"
- "If you had to cut 50%, what's the irreducible core?"
- "What would make this phase a success even without the nice-to-haves?"

**Boundary Keeper (round 3):** Lock the perimeter.
- "What explicitly will NOT be done in this phase?"
- "What adjacent problems is it tempting to solve but shouldn't?"
- "What does 'done' look like — what's the final deliverable?"

**Failure Analyst (round 4):** Find the edge cases that invalidate requirements.
- "What's the worst thing that could go wrong if we get the requirements wrong?"
- "What does a broken version of this look like?"
- "What would cause a verifier to reject the output?"

**Seed Closer (rounds 5–6):** Lock remaining undecided territory.
- "We have [dimension] at [score] — what would make it completely clear?"
- "The remaining ambiguity is in [area] — can we make a decision now?"
- "Is there anything you'd regret not specifying before planning starts?"
</interview_perspectives>

<process>

## Step 1: Initialize

```bash
INIT=$(gsd_run init phase-op "${PHASE}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `state_path`, `requirements_path`, `roadmap_path`, `planning_path`, `response_language`, `commit_docs`.

**If `response_language` is set:** All user-facing text in this workflow MUST be in `{response_language}`. Technical terms, code, and file paths stay in English.

**If `phase_found` is false:**
```
Phase [X] not found in roadmap.
Use `gsd-serena-bridge progress --format markdown` to see available phases.
```
Exit.

**Check for existing SPEC.md:**
```bash
ls ${phase_dir}/*-SPEC.md 2>/dev/null | grep -v AI-SPEC | head -1 || true
```

If SPEC.md already exists:

**If `--auto`:** Auto-select "Update it". Log: `[auto] SPEC.md exists — updating.`

**Otherwise:** Use AskUserQuestion:
- header: "Spec"
- question: "Phase [X] already has a SPEC.md. What do you want to do?"
- options:
- "Update it" — Revise and re-score
- "View it" — Show current spec
- "Skip" — Exit (use existing spec as-is)

If "View": Display SPEC.md, then offer Update/Skip.
If "Skip": Exit with message: "Existing SPEC.md unchanged. Run `gsd-serena-bridge discuss-phase --format markdown` [X] to continue."
If "Update": Load existing SPEC.md, continue to Step 3.

## Step 2: Scout Codebase

**Read these files before any questions:**
- `{requirements_path}` — Project requirements
- `{state_path}` — Decisions already made, current phase, blockers
- ROADMAP.md phase entry — Phase description, goals, canonical refs

**Grep the codebase** for code/files relevant to this phase goal. Look for:
- Existing implementations of similar functionality
- Integration points where new code will connect
- Test coverage gaps relevant to the phase
- Prior phase artifacts (SUMMARY.md, VERIFICATION.md) that inform current state

**Synthesize current state** — the grounded baseline for the interview:
- What exists today related to this phase
- The gap between current state and the phase goal
- The primary deliverable: what file/behavior/capability does NOT exist yet?

Confirm your current state synthesis internally. Do not present it to the user yet — you'll use it to ask precise, grounded questions.

## Step 3: First Ambiguity Assessment

Before questioning begins, score the phase's current ambiguity based only on what ROADMAP.md and REQUIREMENTS.md say:

```
Goal Clarity:       [score 0.0–1.0]
Boundary Clarity:   [score 0.0–1.0]
Constraint Clarity: [score 0.0–1.0]
Acceptance Criteria:[score 0.0–1.0]

Ambiguity: [score] ([calculate])
```

**If `--auto` and initial ambiguity already ≤ 0.20 with all minimums met:** Skip interview — derive SPEC.md directly from roadmap + requirements. Log: `[auto] Phase requirements are already sufficiently clear — generating SPEC.md from existing context.` Jum...

**Otherwise:** Continue to Step 4.

## Step 4: Socratic Interview Loop

**Max 6 rounds.** Each round: 2–3 questions max. End round after user responds.

**Round selection by perspective:**
- Round 1: Researcher
- Round 2: Researcher + Simplifier
- Round 3: Boundary Keeper
- Round 4: Failure Analyst
- Rounds 5–6: Seed Closer (focus on lowest-scoring dimensions)

**After each round:**
1. Update all 4 dimension scores from the user's answers
2. Calculate new ambiguity score
3. Display the updated scoring:

```
After round [N]:
Goal Clarity:       [score] (min 0.75) [✓ or ↑ needed]
Boundary Clarity:   [score] (min 0.70) [✓ or ↑ needed]
Constraint Clarity: [score] (min 0.65) [✓ or ↑ needed]
Acceptance Criteria:[score] (min 0.70) [✓ or ↑ needed]
Ambiguity: [score] (gate: ≤ 0.20)
```

**Gate check after each round:**

If gate passes (ambiguity ≤ 0.20 AND all minimums met):

**If `--auto`:** Jump to Step 6.

**Otherwise:** AskUserQuestion:
- header: "Spec Gate Passed"
- question: "Ambiguity is [score] — requirements are clear enough to write SPEC.md. Proceed?"
- options:
- "Yes — write SPEC.md" → Jump to Step 6
- "One more round" → Continue interview
- "Done talking — write it" → Jump to Step 6

**If max rounds reached (6) and gate not passed:**

**If `--auto`:** Write SPEC.md anyway — flag unresolved dimensions. Log: `[auto] Max rounds reached. Writing SPEC.md with [N] dimensions below minimum. Planner will need to treat these as assumptions.`

**Otherwise:** AskUserQuestion:
- header: "Max Rounds"
- question: "After 6 rounds, ambiguity is [score]. [List dimensions still below minimum.] What would you like to do?"
- options:
- "Write SPEC.md anyway — flag gaps" → Write SPEC.md, mark unresolved dimensions in Ambiguity Report
- "Keep talking" → Continue (no round limit from here)
- "Abandon" → Exit without writing

**If `--auto` mode throughout:** Replace all AskUserQuestion calls above with Claude's recommended choice. Log decisions inline. Apply the same logic as `--auto` in discuss-phase.

**Text mode (`workflow.text_mode: true` or `--text` flag):** Use plain-text numbered lists instead of AskUserQuestion TUI menus.

## Step 5: (covered inline — ambiguity scoring is per-round)

## Step 5.5: Edge-Completeness Probe

Run AFTER the ambiguity gate passes (you probe edges of clear requirements, not vague
ones). Reference: @~/.claude/gsd-core/references/edge-probe.md.

**Runtime coverage compute — resolve and invoke edge-probe.cjs:**

```bash
# Resolve the compiled edge-probe.cjs against the GSD install dir via RUNTIME_DIR (#448)
# — NOT the consuming project's git root — falling back to git toplevel / $HOME/.claude.
# Mirrors the ui-safety-gate.cjs resolution idiom at autonomous.md:290 / plan-phase.md:631.
_GSD_RT="${RUNTIME_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
EDGE_PROBE_JS=$(for _c in \
"$_GSD_RT/gsd-core/bin/lib/edge-probe.cjs" \
"$_GSD_RT/bin/lib/edge-probe.cjs" \
"$_GSD_RT/.claude/bin/lib/edge-probe.cjs" \
"$HOME/.claude/gsd-core/bin/lib/edge-probe.cjs" \
"$HOME/.claude/bin/lib/edge-probe.cjs"; do
[ -f "$_c" ] && { echo "$_c"; break; }
done)

# Graceful degradation — never silent skip (RR-04). Build ONLY when $_GSD_RT is a verified
# GSD source checkout (has tsconfig.build.json + src/edge-probe.cts), and pin npm to it with
# --prefix so we never trigger the CONSUMING project's own build:lib (its cwd package scripts:
# codegen/migrations/writes) during a spec workflow. Real installs ship the compiled .cjs via
# prepublishOnly, so this build path only matters in a GSD dev checkout (review High).
if [ -z "$EDGE_PROBE_JS" ]; then
if [ -f "$_GSD_RT/tsconfig.build.json" ] && [ -f "$_GSD_RT/src/edge-probe.cts" ]; then
npm --prefix "$_GSD_RT" run build:lib 2>/dev/null || true
EDGE_PROBE_JS=$(for _c in \
"$_GSD_RT/gsd-core/bin/lib/edge-probe.cjs" \
"$_GSD_RT/bin/lib/edge-probe.cjs" \
"$_GSD_RT/.claude/bin/lib/edge-probe.cjs" \
"$HOME/.claude/gsd-core/bin/lib/edge-probe.cjs" \
"$HOME/.claude/bin/lib/edge-probe.cjs"; do
[ -f "$_c" ] && { echo "$_c"; break; }
done)
fi
if [ -z "$EDGE_PROBE_JS" ]; then
echo "ERROR: edge-probe.cjs not found — reinstall GSD or run \`npm run build:lib\` in your GSD checkout." >&2
exit 1
fi
fi

# Write the Requirements gathered in THIS spec session to a temp JSON, then invoke the
# canonical coverage compute. Populate the heredoc from the SPEC's Requirements — one object
# per requirement: {"id","text","shapes"?}. This is the load-bearing step: an empty file makes
# the probe a no-op, so the guard below fails loud rather than silently skipping (RR-04).
REQS_JSON=$(mktemp "${TMPDIR:-/tmp}/edge-probe-reqs-XXXXXX.json")
cat > "$REQS_JSON" <<'JSON'
[
{ "id": "R1", "text": "<replace: requirement text from the SPEC>" }
]
JSON
# Guard — never invoke on an empty/invalid array, OR one still holding the heredoc
# `<replace: …>` placeholder (a forgotten substitution would otherwise yield a
# meaningful-looking but bogus coverage report). Fail loud, not silent no-op.
if ! node -e 'const a=require(process.argv[1]);if(!Array.isArray(a)||a.length===0)process.exit(1);if(a.some(r=>typeof r.text!=="string"||!r.text.trim()||r.text.includes("<replace:")))process.exit(1)' "$REQS_JSON" 2>/dev/null; then
echo "ERROR: edge-probe requirements JSON is empty/invalid or still holds the <replace: …> placeholder — populate \$REQS_JSON from the SPEC Requirements before Step 5.5 runs." >&2
exit 1
fi
# Invoke the compiled engine and CAPTURE its report — it computes which categories apply per
# requirement. The covered/backstop/dismissed/unresolved rows in $COVERAGE drive the
# resolution loop below (canonical taxonomy compute, NOT LLM re-derivation from prose).
# The engine FAILS CLOSED (exit 2) on an invalid authored shape or bad input — so the capture
# MUST be exit-checked. A bare `COVERAGE=$(node …)` swallows that exit code, leaves $COVERAGE
# empty, and lets the workflow fall through to prose re-derivation: fail-OPEN at the boundary
# the engine validation exists to protect. Make the run fatal, then validate the captured
# report is well-formed JSON before the resolution loop consumes it.
if ! COVERAGE=$(node "$EDGE_PROBE_JS" "$REQS_JSON"); then
rm -f "$REQS_JSON"
echo "ERROR: edge-probe engine failed (invalid shapes or bad input) — fix the requirement(s) and re-run; never proceed with empty coverage." >&2
exit 1
fi
rm -f "$REQS_JSON"
# Exit-0-but-garbage guard: the report must parse as JSON with the expected { items[], coverage{} } shape.
if ! printf '%s' "$COVERAGE" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{let r;try{r=JSON.parse(s)}catch{process.exit(1)}if(!r||!Array.isArray(r.items)||typeof r.coverage!=="object"||r.coverage===null)process.exit(1)})'; then
echo "ERROR: edge-probe produced an unparseable or malformed coverage report — refusing to proceed with the resolution loop." >&2
exit 1
fi
# Zero-applicable guard: a report where the engine proposed NO applicable edge across ANY
# requirement is far more likely a shape-classification miss (or malformed requirements) than
# a genuinely edge-free spec — the same fail-open shape as an invalid shape yielding
# applicable:0. Surface it loudly; the author must explicitly confirm "no applicable edges"
# below rather than silently emitting a green empty ## Edge Coverage section.
APPLICABLE=$(printf '%s' "$COVERAGE" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{let n=0;try{n=JSON.parse(s).coverage.applicable}catch{n=0}process.stdout.write(String(n))})')
if [ "$APPLICABLE" = "0" ]; then

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.
