# Bridge Workflow: discuss-phase-modes-analyze

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-discuss-phase-modes-analyze` in a target project.

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

- Contract ID: `gsd-workflow-discuss-phase-modes-analyze`
- Status: `planned`
- Source path: `gsd-core/workflows/discuss-phase/modes/analyze.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/discuss-phase/modes/analyze.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/discuss-phase/modes/analyze.md`

## Translated GSD Workflow

# --analyze mode — trade-off tables before each question

> **Lazy-loaded overlay.** Read this file from `workflows/discuss-phase.md`
> when `--analyze` is present in `$ARGUMENTS`. Combinable with default,
> `--all`, `--chain`, `--text`, `--batch`.

## Effect

Before presenting each question (or question group, in batch mode), provide
a brief **trade-off analysis** for the decision:
- 2-3 options with pros/cons based on codebase context and common patterns
- A recommended approach with reasoning
- Known pitfalls or constraints from prior phases

## Example

```markdown
**Trade-off analysis: Authentication strategy**

| Approach | Pros | Cons |
|----------|------|------|
| Session cookies | Simple, httpOnly prevents XSS | Requires CSRF protection, sticky sessions |
| JWT (stateless) | Scalable, no server state | Token size, revocation complexity |
| OAuth 2.0 + PKCE | Industry standard for SPAs | More setup, redirect flow UX |

💡 Recommended: OAuth 2.0 + PKCE — your app has social login in requirements (REQ-04) and this aligns with the existing NextAuth setup in `src/lib/auth.ts`.

How should users authenticate?
```

This gives the user context to make informed decisions without extra
prompting.

When `--analyze` is absent, present questions directly as before (no
trade-off table).

## Sourcing the analysis

- Pros/cons should reflect the codebase context loaded in `scout_codebase`
and any prior decisions surfaced in `load_prior_context`.
- The recommendation must explicitly tie to project context (e.g.,
existing libraries, prior phase decisions, documented requirements).
- If a related ADR or spec is referenced in CONTEXT.md `<canonical_refs>`,
cite it in the recommendation.
