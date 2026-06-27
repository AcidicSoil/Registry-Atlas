# Bridge Workflow: discuss-phase-modes-batch

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-discuss-phase-modes-batch` in a target project.

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

- Contract ID: `gsd-workflow-discuss-phase-modes-batch`
- Status: `planned`
- Source path: `gsd-core/workflows/discuss-phase/modes/batch.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/discuss-phase/modes/batch.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/discuss-phase/modes/batch.md`

## Translated GSD Workflow

# --batch mode — grouped question batches

> **Lazy-loaded overlay.** Read this file from `workflows/discuss-phase.md`
> when `--batch` is present in `$ARGUMENTS`. Combinable with default,
> `--all`, `--chain`, `--text`, `--analyze`.

## Argument parsing

Parse optional `--batch` from `$ARGUMENTS`:
- Accept `--batch`, `--batch=N`, or `--batch N`
- Default to **4 questions per batch** when no number is provided
- Clamp explicit sizes to **2–5** so a batch stays answerable
- If `--batch` is absent, keep the existing one-question-at-a-time flow
(default mode).

## Effect on discuss_areas

`--batch` mode: ask **2–5 numbered questions in one plain-text turn** per
area, instead of the default 4 single-question AskUserQuestion turns.

- Group closely related questions for the current area into a single
message
- Keep each question concrete and answerable in one reply
- When options are helpful, include short inline choices per question
rather than a separate AskUserQuestion for every item
- After the user replies, reflect back the captured decisions, note any
unanswered items, and ask only the minimum follow-up needed before
moving on
- Preserve adaptiveness between batches: use the full set of answers to
decide the next batch or whether the area is sufficiently clear

## Philosophy

Stay adaptive, but let the user choose the pacing.
- Default mode: 4 single-question turns, then check whether to continue
- `--batch` mode: 1 grouped turn with 2–5 numbered questions, then check
whether to continue

Each answer set should reveal the next question or next batch.

## Example batch

```
Authentication — please answer 1–4:

1. Which auth strategy?  (a) Session cookies  (b) JWT  (c) OAuth 2.0 + PKCE
2. Where do tokens live?  (a) httpOnly cookie  (b) localStorage  (c) memory only
3. Session lifetime?       (a) 1h  (b) 24h  (c) 30d  (d) configurable
4. Account recovery?       (a) email reset  (b) magic link  (c) both

Reply with your choices (e.g. "1c, 2a, 3b, 4c") or describe in your own words.
```
