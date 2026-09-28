# Future Enhancements

## Direct external documentation discovery

Registry Atlas already resolves known and indexed catalog items through each registry's item URL template, and reviewed item summaries may provide direct documentation URLs.

The remaining enhancement is narrower: discover and verify direct human-facing documentation URLs for catalog items when registries publish them but do not expose them in the current reviewed enrichment.

Any future implementation should:

- prefer explicit upstream documentation URLs over generated URL guesses;
- keep raw registry JSON routes distinct from human documentation pages;
- fall back to the registry homepage when no verified documentation URL exists;
- avoid introducing a registry-wide `docBaseUrl` unless a registry explicitly documents a stable URL contract;
- validate links during maintenance/sync work rather than at browser runtime.

This is enrichment work, not a blocker for item discovery or install/detail routes.
