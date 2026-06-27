# Bridge Invocation

This memory defines the project-local invocation loop for `serena-gsd-bridge`.

For workflow/session work, invoke the bridge resolver from the repository root before deciding the next project action. Installed target projects should use the packaged command:

```bash
cat <<'EOF_REQUEST' | gsd-serena-bridge resolve --stdin --format markdown
<verbatim user request>
EOF_REQUEST
```

Follow the returned bridge output:

1. Run the returned `prepare` or next command when present.
2. Read `.planning/.bridge/last-packet.md` or `.planning/.bridge/last-packet.json`.
3. Inspect required reads, allowed writes, forbidden writes, expected artifacts, validation command, transition rule, and report format.
4. Perform only packet-scoped work unless the user explicitly requests a narrow override or the bridge is blocked by stale or malformed state.
5. Run the packet validation command.
6. Transition state only after validation passes and the packet says transition is safe.
7. Use `gsd-serena-bridge state next --format markdown` when the next safe workflow action is unclear.

Useful bridge commands:

```bash
gsd-serena-bridge doctor --format markdown
gsd-serena-bridge capability doctor --format markdown
gsd-serena-bridge state next --format markdown
gsd-serena-bridge validate --from-state --format markdown
gsd-serena-bridge transition --from-state --format markdown
```

If the bridge returns `blocked` or `unrecognized_request`, report the result and either map the user request to an obvious supported bridge command or use a narrow manual override with validation evidence. Do not silently override forbidden writes, failed validation, or unsafe transitions.

When maintaining `serena-gsd-bridge` itself, do not hide behind the invocation loop as if the bridge were untouchable. Use it as the harness, but treat incorrect routing, stale packets, false success, missing parity behavior, misleading mode/memory guidance, or lifecycle dead ends as product bugs. Fix those bugs in the active packet when authorized, or create/activate a scoped phase or packet for the fix.
