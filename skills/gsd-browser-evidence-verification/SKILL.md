# GSD Browser Evidence Verification

Use this skill when verifying browser-facing GSD work or writing completion evidence for frontend tasks.

## Concern boundary

This skill is only for evidence requirements and verification reporting. Use `skills/gsd-browser-automation/SKILL.md` for driving the browser, and `skills/opengsd-docs-lookup/SKILL.md` for QMD/docs lookup.

## Required evidence for browser-facing completion

When marking browser-facing work complete, include:

- GSD Browser session name;
- route or URL tested;
- user action path tested;
- screenshot, debug bundle, trace, HAR, recording, or exported evidence path under `.planning/browser-artifacts/`;
- any human confirmation or manual live-viewer check;
- any known gaps or flows not tested.

## Minimum verification bar

For each changed browser-facing feature or flow, capture at least one screenshot or debug bundle after exercising the behavior.

If GSD Browser is unavailable, do not fabricate browser validation. Mark the work as needing environment setup or human review.

## Summary wording pattern

```text
Browser verification:
- session: <session-name>
- route: <url-or-route>
- action path: <brief flow>
- evidence: .planning/browser-artifacts/<artifact>
- result: passed|needs review
```
