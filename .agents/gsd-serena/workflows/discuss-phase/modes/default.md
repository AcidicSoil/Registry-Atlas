# Bridge Workflow: discuss-phase-modes-default

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-discuss-phase-modes-default` in a target project.

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

- Contract ID: `gsd-workflow-discuss-phase-modes-default`
- Status: `planned`
- Source path: `gsd-core/workflows/discuss-phase/modes/default.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/discuss-phase/modes/default.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/discuss-phase/modes/default.md`

## Translated GSD Workflow

# Default mode — interactive discuss-phase

> **Lazy-loaded.** Read this file from `workflows/discuss-phase.md` when no
> mode flag is present (the baseline interactive flow). When `--text`,
> `--batch`, or `--analyze` is also present, layer the corresponding overlay
> file from this directory on top of the rules below.

This document defines `discuss_areas` for the default flow. The shared steps
that come before (`initialize`, `check_blocking_antipatterns`, `check_spec`,
`check_existing`, `load_prior_context`, `cross_reference_todos`,
`scout_codebase`, `analyze_phase`, `present_gray_areas`) live in the parent
file and run for every mode.

## discuss_areas (default, interactive)

For each selected area, conduct a focused discussion loop.

**Research-before-questions mode:** Check if `workflow.research_before_questions` is enabled in config (from init context or `.planning/config.json`). When enabled, before presenting questions for each area:
1. Do a brief web search for best practices related to the area topic
2. Summarize the top findings in 2-3 bullet points
3. Present the research alongside the question so the user can make a more informed decision

Example with research enabled:
```text
Let's talk about [Authentication Strategy].

📊 Best practices research:
• OAuth 2.0 + PKCE is the current standard for SPAs (replaces implicit flow)
• Session tokens with httpOnly cookies preferred over localStorage for XSS protection
• Consider passkey/WebAuthn support — adoption is accelerating in 2025-2026

With that context: How should users authenticate?
```

When disabled (default), skip the research and present questions directly as before.

**Philosophy:** stay adaptive. Default flow is 4 single-question turns, then
check whether to continue. Each answer should reveal the next question.

**For each area:**

1. **Announce the area:**
```text
Let's talk about [Area].
```

2. **Ask 4 questions using AskUserQuestion:**
- header: "[Area]" (max 12 chars — abbreviate if needed)
- question: Specific decision for this area
- options: 2-3 concrete choices (AskUserQuestion adds "Other" automatically), with the recommended choice highlighted and brief explanation why
- **Annotate options with code context** when relevant:
```text
"How should posts be displayed?"
- Cards (reuses existing Card component — consistent with Messages)
- List (simpler, would be a new pattern)
- Timeline (needs new Timeline component — none exists yet)
```
- Include "You decide" as an option when reasonable — captures Claude discretion
- Native MCP/tool seam translated: `- **Context7 for library choices:** When a gray area involves library selection (e.g., "magic links" → query next-auth docs) or API approach decisions, use 'mcp__context7__*' tools to fetch current documentation and inform the options. Don't use Context7 for every question — only when library-specific knowledge improves the options.` -> use the available Serena/web/tool equivalent only when available; otherwise record an operation-plan fallback.

3. **After the current set of questions, check:**
- header: "[Area]" (max 12 chars)
- question: "More questions about [area], or move to next? (Remaining: [list other unvisited areas])"
- options: "More questions" / "Next area"

When building the question text, list the remaining unvisited areas so the user knows what's ahead. For example: "More questions about Layout, or move to next? (Remaining: Loading behavior, Content ordering)"

If "More questions" → ask another 4 single questions, then check again
If "Next area" → proceed to next selected area
If "Other" (free text) → interpret intent: continuation phrases ("chat more", "keep going", "yes", "more") map to "More questions"; advancement phrases ("done", "move on", "next", "skip") map to "Next area". If ambiguous, ask: "Continue with more questions ...

4. **After all initially-selected areas complete:**
- Summarize what was captured from the discussion so far
- AskUserQuestion:
- header: "Done"
- question: "We've discussed [list areas]. Which gray areas remain unclear?"
- options: "Explore more gray areas" / "I'm ready for context"
- If "Explore more gray areas":
- Identify 2-4 additional gray areas based on what was learned
- Return to present_gray_areas logic with these new areas
- Loop: discuss new areas, then prompt again
- If "I'm ready for context": Proceed to write_context

**Canonical ref accumulation during discussion:**
When the user references a doc, spec, or ADR during any answer — e.g., "read adr-014", "check the MCP spec", "per browse-spec.md" — immediately:
1. Read the referenced doc (or confirm it exists)
2. Add it to the canonical refs accumulator with full relative path
3. Use what you learned from the doc to inform subsequent questions

These user-referenced docs are often MORE important than ROADMAP.md refs because they represent docs the user specifically wants downstream agents to follow. Never drop them.

**Question design:**
- Options should be concrete, not abstract ("Cards" not "Option A")
- Each answer should inform the next question or next batch
- If user picks "Other" to provide freeform input (e.g., "let me describe it", "something else", or an open-ended reply), ask your follow-up as plain text — NOT another AskUserQuestion. Wait for them to type at the normal prompt, then reflect their input ba...

**Thinking partner (conditional):**
If `features.thinking_partner` is enabled in config, check the user's answer for tradeoff signals
(see `references/thinking-partner.md` for signal list). If tradeoff detected:

```text
I notice competing priorities here — {option_A} optimizes for {goal_A} while {option_B} optimizes for {goal_B}.

Want me to think through the tradeoffs before we lock this in?
[Yes, analyze] / [No, decision made]
```

If yes: provide 3-5 bullet analysis (what each optimizes/sacrifices, alignment with PROJECT.md goals, recommendation). Then return to normal flow.

**Scope creep handling:**
If user mentions something outside the phase domain:
```text
"[Feature] sounds like a new capability — that belongs in its own phase.
I'll note it as a deferred idea.

Back to [current area]: [return to current question]"
```

Track deferred ideas internally.

**Incremental checkpoint — save after each area completes:**

After each area is resolved (user says "Next area"), immediately write a checkpoint file with all decisions captured so far. This prevents data loss if the session is interrupted mid-discussion.

**Checkpoint file:** `${phase_dir}/${padded_phase}-DISCUSS-CHECKPOINT.json`

Schema: read `workflows/discuss-phase/templates/checkpoint.json` for the
canonical structure — copy it and substitute the live values.

**On session resume:** Handled in the parent's `check_existing` step. After
`write_context` completes successfully, the parent's `git_commit` step
deletes the checkpoint.

**Track discussion log data internally:**
For each question asked, accumulate:
- Area name
- All options presented (label + description)
- Which option the user selected (or their free-text response)
- Any follow-up notes or clarifications the user provided

This data is used to generate DISCUSSION-LOG.md in the parent's `git_commit` step.
